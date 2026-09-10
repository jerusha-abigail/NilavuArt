"""Supabase access-token verification with explicit local demo mode."""
from __future__ import annotations

import os

import httpx
from fastapi import Header, HTTPException


def auth_configured() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY"))


def auth_required() -> bool:
    return os.getenv("AUTH_REQUIRED", "false").lower() == "true"


def public_auth_config() -> dict:
    return {
        "enabled": auth_configured(),
        "required": auth_required() or auth_configured(),
        "supabase_url": os.getenv("SUPABASE_URL") if auth_configured() else None,
        "supabase_anon_key": os.getenv("SUPABASE_ANON_KEY") if auth_configured() else None,
    }


async def get_current_user(authorization: str | None = Header(default=None)) -> str:
    if not auth_configured():
        if auth_required():
            raise HTTPException(503, "Authentication is not configured.")
        return "demo-user"

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign in to access your private gallery.")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{os.environ['SUPABASE_URL'].rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": os.environ["SUPABASE_ANON_KEY"],
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(503, "Authentication service is unavailable.") from exc

    if response.status_code != 200:
        raise HTTPException(401, "Your session is invalid or expired.")
    user_id = response.json().get("id")
    if not user_id:
        raise HTTPException(401, "Your session is invalid or expired.")
    return str(user_id)
