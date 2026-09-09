"""Optional vision-LLM narratives with OpenCV-only fallback."""
from __future__ import annotations

import base64
import io
import json
import os
from typing import Any

import httpx
from PIL import Image, ImageOps
from pydantic import BaseModel, Field, ValidationError


class NarrativeCritique(BaseModel):
    narrative: str = Field(min_length=20, max_length=1800)
    strengths: list[str] = Field(min_length=1, max_length=3)
    growth_areas: list[str] = Field(min_length=1, max_length=3)
    next_steps: list[str] = Field(min_length=1, max_length=3)
    recommended_exercise: str = Field(min_length=5, max_length=500)


class LLMFeedbackError(RuntimeError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def provider_status() -> dict[str, Any]:
    configured = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "provider": "openai-compatible",
        "configured": configured,
        "model": os.getenv("OPENAI_VISION_MODEL", "gpt-4.1-mini") if configured else None,
    }


def _prepare_image(image_bytes: bytes) -> str:
    with Image.open(io.BytesIO(image_bytes)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image.thumbnail((1600, 1600))
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=82, optimize=True)
    encoded = base64.b64encode(output.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def _response_schema() -> dict[str, Any]:
    string_list = {
        "type": "array",
        "items": {"type": "string"},
        "minItems": 1,
        "maxItems": 3,
    }
    return {
        "type": "object",
        "properties": {
            "narrative": {"type": "string"},
            "strengths": string_list,
            "growth_areas": string_list,
            "next_steps": string_list,
            "recommended_exercise": {"type": "string"},
        },
        "required": [
            "narrative",
            "strengths",
            "growth_areas",
            "next_steps",
            "recommended_exercise",
        ],
        "additionalProperties": False,
    }


async def generate_narrative(
    image_bytes: bytes,
    cv_result: dict[str, Any],
    artist_level: str = "student",
) -> tuple[NarrativeCritique, str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise LLMFeedbackError("not_configured")

    model = os.getenv("OPENAI_VISION_MODEL", "gpt-4.1-mini")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    metrics = json.dumps(cv_result["scores"], separators=(",", ":"))
    prompt = (
        f"Review this artwork for a {artist_level} artist. OpenCV measured these 0-100 "
        f"visual metrics: {metrics}. Treat them as supporting evidence, not artistic truth. "
        "Discuss only the artwork; do not infer identity, health, ethnicity, location, or other "
        "personal traits. Be warm, specific, age-appropriate, and constructive. Cite visible "
        "details, identify strengths before growth areas, and give achievable next steps."
    )
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are an encouraging art educator. Return only valid JSON matching the schema.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": _prepare_image(image_bytes)}},
                ],
            },
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "artwork_critique",
                "strict": True,
                "schema": _response_schema(),
            },
        },
        "temperature": 0.4,
        "max_tokens": 1000,
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(45.0)) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        critique = NarrativeCritique.model_validate_json(content)
    except httpx.HTTPStatusError as exc:
        try:
            provider_code = exc.response.json().get("error", {}).get("code")
        except ValueError:
            provider_code = None
        if exc.response.status_code == 401:
            code = "invalid_credentials"
        elif exc.response.status_code == 429 and provider_code in {
            "insufficient_quota",
            "credit_balance_exhausted",
        }:
            code = "quota_exhausted"
        elif exc.response.status_code == 429:
            code = "rate_limited"
        elif exc.response.status_code == 404:
            code = "model_unavailable"
        else:
            code = "provider_error"
        raise LLMFeedbackError(code) from exc
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, ValidationError) as exc:
        raise LLMFeedbackError("provider_error") from exc

    return critique, "openai-compatible", model
