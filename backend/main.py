"""NilavuArt backend: upload artwork, get CV-based feedback, track progress,
and receive recommended practice exercises.
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from cv_analysis import analyze_artwork
from database import (
    Artwork,
    Feedback,
    NarrativeFeedback,
    SessionLocal,
    SiteFeedback,
    get_db,
    init_db,
)
from exercises import recommend_exercises, seed_exercises
from llm_feedback import LLMFeedbackError, generate_narrative, provider_status

FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "storage" / "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

app = FastAPI(title="NilavuArt API", version="1.0.0")


class SiteFeedbackCreate(BaseModel):
    display_name: str = Field(default="Anonymous", max_length=50)
    category: Literal["general", "artwork_feedback", "exercises", "idea", "issue"]
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=10, max_length=1200)
    website: str = Field(default="", max_length=0)


class ArtworkTitleUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=100)


class ExistingNarrativeRequest(BaseModel):
    consent: bool
    artist_level: Literal["beginner", "student", "intermediate", "advanced"] = "student"

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_exercises(db)
    finally:
        db.close()


app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/llm/status")
def get_llm_status():
    return provider_status()


@app.post("/api/site-feedback", status_code=201)
def submit_site_feedback(payload: SiteFeedbackCreate, db: Session = Depends(get_db)):
    message = payload.message.strip()
    if len(message) < 10:
        raise HTTPException(422, "Feedback must contain at least 10 characters.")
    feedback = SiteFeedback(
        display_name=payload.display_name.strip() or "Anonymous",
        category=payload.category,
        rating=payload.rating,
        message=message,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {
        "id": feedback.id,
        "message": "Thank you—your feedback was received.",
        "status": feedback.status,
    }


@app.post("/api/artworks/upload")
async def upload_artwork(
    user_id: str = Query(default="demo-user"),
    title: str = Query(default="Untitled"),
    author_name: str = Query(default="Jerusha Arun", max_length=100),
    exercise_tag: str | None = Query(default=None),
    use_llm: bool = Query(default=False),
    artist_level: Literal["beginner", "student", "intermediate", "advanced"] = Query(
        default="student"
    ),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, or WEBP images are supported.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "File too large (max 10 MB).")

    try:
        result = analyze_artwork(contents)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    ext = CONTENT_TYPE_EXTENSIONS[file.content_type]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, safe_name), "wb") as f:
        f.write(contents)

    artwork = Artwork(
        user_id=user_id,
        filename=safe_name,
        title=title,
        author_name=author_name.strip() or "Anonymous Artist",
        exercise_tag=exercise_tag,
    )
    db.add(artwork)
    db.commit()
    db.refresh(artwork)

    scores = result["scores"]
    feedback = Feedback(
        artwork_id=artwork.id,
        overall_score=result["overall_score"],
        brightness_score=scores["brightness"],
        contrast_score=scores["contrast"],
        color_balance_score=scores["color_balance"],
        composition_score=scores["composition"],
        line_quality_score=scores["line_quality"],
        saturation_score=scores["saturation"],
        summary=result["summary"],
        suggestions_json=json.dumps(result["suggestions"]),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    narrative_feedback = None
    narrative_status = "not_requested"
    if use_llm:
        narrative_status = "unavailable"
        try:
            critique, provider, model = await generate_narrative(
                contents, result, artist_level=artist_level
            )
            narrative_feedback = NarrativeFeedback(
                artwork_id=artwork.id,
                narrative=critique.narrative,
                strengths_json=json.dumps(critique.strengths),
                growth_areas_json=json.dumps(critique.growth_areas),
                next_steps_json=json.dumps(critique.next_steps),
                recommended_exercise=critique.recommended_exercise,
                title_suggestions_json=json.dumps(critique.title_suggestions),
                provider=provider,
                model=model,
            )
            db.add(narrative_feedback)
            db.commit()
            db.refresh(narrative_feedback)
            narrative_status = "complete"
        except LLMFeedbackError as exc:
            narrative_status = exc.code

    recommended = recommend_exercises(db, result["weak_tags"])

    serialized_feedback = _serialize_feedback(feedback, narrative_feedback)
    serialized_feedback["narrative_status"] = narrative_status

    return {
        "artwork": _serialize_artwork(artwork),
        "feedback": serialized_feedback,
        "recommended_exercises": [_serialize_exercise(e) for e in recommended],
    }


@app.get("/api/artworks")
def list_artworks(user_id: str = Query(default="demo-user"), db: Session = Depends(get_db)):
    artworks = (
        db.query(Artwork)
        .filter(Artwork.user_id == user_id)
        .order_by(Artwork.created_at.asc())
        .all()
    )
    return [
        {
            **_serialize_artwork(a),
            "feedback": _serialize_feedback(a.feedback, a.narrative_feedback)
            if a.feedback
            else None,
        }
        for a in artworks
    ]


@app.patch("/api/artworks/{artwork_id}/title")
def update_artwork_title(
    artwork_id: int,
    payload: ArtworkTitleUpdate,
    user_id: str = Query(default="demo-user"),
    db: Session = Depends(get_db),
):
    artwork = (
        db.query(Artwork)
        .filter(Artwork.id == artwork_id, Artwork.user_id == user_id)
        .first()
    )
    if artwork is None:
        raise HTTPException(404, "Artwork not found.")
    title = payload.title.strip()
    if not title:
        raise HTTPException(422, "Title cannot be empty.")
    artwork.title = title
    db.commit()
    db.refresh(artwork)
    return _serialize_artwork(artwork)


@app.delete("/api/artworks/{artwork_id}")
def delete_artwork(
    artwork_id: int,
    user_id: str = Query(default="demo-user"),
    db: Session = Depends(get_db),
):
    artwork = (
        db.query(Artwork)
        .filter(Artwork.id == artwork_id, Artwork.user_id == user_id)
        .first()
    )
    if artwork is None:
        raise HTTPException(404, "Artwork not found.")

    image_path = Path(UPLOAD_DIR) / artwork.filename
    db.delete(artwork)
    db.commit()
    if image_path.is_file():
        image_path.unlink()
    return {"id": artwork_id, "message": "Artwork deleted."}


@app.post("/api/artworks/{artwork_id}/narrative")
async def generate_existing_artwork_narrative(
    artwork_id: int,
    payload: ExistingNarrativeRequest,
    user_id: str = Query(default="demo-user"),
    db: Session = Depends(get_db),
):
    if not payload.consent:
        raise HTTPException(400, "Consent is required to send artwork to the vision provider.")
    artwork = (
        db.query(Artwork)
        .filter(Artwork.id == artwork_id, Artwork.user_id == user_id)
        .first()
    )
    if artwork is None:
        raise HTTPException(404, "Artwork not found.")
    if artwork.narrative_feedback:
        return _serialize_feedback(artwork.feedback, artwork.narrative_feedback)

    image_path = Path(UPLOAD_DIR) / artwork.filename
    if not image_path.is_file():
        raise HTTPException(404, "Artwork image file not found.")
    contents = image_path.read_bytes()
    cv_result = analyze_artwork(contents)
    try:
        critique, provider, model = await generate_narrative(
            contents, cv_result, artist_level=payload.artist_level
        )
    except LLMFeedbackError as exc:
        raise HTTPException(503, exc.code) from exc

    narrative = NarrativeFeedback(
        artwork_id=artwork.id,
        narrative=critique.narrative,
        strengths_json=json.dumps(critique.strengths),
        growth_areas_json=json.dumps(critique.growth_areas),
        next_steps_json=json.dumps(critique.next_steps),
        recommended_exercise=critique.recommended_exercise,
        title_suggestions_json=json.dumps(critique.title_suggestions),
        provider=provider,
        model=model,
    )
    db.add(narrative)
    db.commit()
    db.refresh(narrative)
    result = _serialize_feedback(artwork.feedback, narrative)
    result["narrative_status"] = "complete"
    return result


@app.get("/api/progress")
def get_progress(user_id: str = Query(default="demo-user"), db: Session = Depends(get_db)):
    """Return a time series of overall + per-metric scores for charting."""
    artworks = (
        db.query(Artwork)
        .filter(Artwork.user_id == user_id)
        .order_by(Artwork.created_at.asc())
        .all()
    )
    points = []
    for a in artworks:
        if not a.feedback:
            continue
        points.append(
            {
                "artwork_id": a.id,
                "date": a.created_at.isoformat(),
                "title": a.title,
                "overall_score": a.feedback.overall_score,
                "brightness": a.feedback.brightness_score,
                "contrast": a.feedback.contrast_score,
                "color_balance": a.feedback.color_balance_score,
                "composition": a.feedback.composition_score,
                "line_quality": a.feedback.line_quality_score,
                "saturation": a.feedback.saturation_score,
            }
        )
    return {"points": points}


@app.get("/api/exercises/recommended")
def get_recommended_exercises(
    user_id: str = Query(default="demo-user"), db: Session = Depends(get_db)
):
    """Recommend exercises based on the artist's most recent weak metrics."""
    latest = (
        db.query(Artwork)
        .filter(Artwork.user_id == user_id)
        .order_by(Artwork.created_at.desc())
        .first()
    )
    if not latest or not latest.feedback:
        return {"recommended_exercises": []}

    fb = latest.feedback
    scores = {
        "brightness": fb.brightness_score,
        "contrast": fb.contrast_score,
        "color_balance": fb.color_balance_score,
        "composition": fb.composition_score,
        "line_quality": fb.line_quality_score,
        "saturation": fb.saturation_score,
    }
    weak_tags = sorted(scores, key=scores.get)[:3]
    recommended = recommend_exercises(db, weak_tags)
    return {"recommended_exercises": [_serialize_exercise(e) for e in recommended]}


def _serialize_artwork(a: Artwork) -> dict:
    return {
        "id": a.id,
        "user_id": a.user_id,
        "title": a.title,
        "author_name": a.author_name or "Anonymous Artist",
        "exercise_tag": a.exercise_tag,
        "image_url": f"/uploads/{a.filename}",
        "created_at": a.created_at.isoformat() if isinstance(a.created_at, datetime) else a.created_at,
    }


def _serialize_feedback(
    f: Feedback, narrative_feedback: NarrativeFeedback | None = None
) -> dict:
    result = {
        "overall_score": f.overall_score,
        "scores": {
            "brightness": f.brightness_score,
            "contrast": f.contrast_score,
            "color_balance": f.color_balance_score,
            "composition": f.composition_score,
            "line_quality": f.line_quality_score,
            "saturation": f.saturation_score,
        },
        "summary": f.summary,
        "suggestions": json.loads(f.suggestions_json),
        "narrative_feedback": None,
    }
    if narrative_feedback:
        result["narrative_feedback"] = {
            "narrative": narrative_feedback.narrative,
            "strengths": json.loads(narrative_feedback.strengths_json),
            "growth_areas": json.loads(narrative_feedback.growth_areas_json),
            "next_steps": json.loads(narrative_feedback.next_steps_json),
            "recommended_exercise": narrative_feedback.recommended_exercise,
            "title_suggestions": json.loads(narrative_feedback.title_suggestions_json)
            if narrative_feedback.title_suggestions_json
            else [],
            "provider": narrative_feedback.provider,
            "model": narrative_feedback.model,
        }
    return result


def _serialize_exercise(e) -> dict:
    return {
        "id": e.id,
        "tag": e.tag,
        "title": e.title,
        "description": e.description,
        "difficulty": e.difficulty,
    }


if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def serve_frontend(path: str):
        requested_file = (FRONTEND_DIST / path).resolve()
        if requested_file.is_relative_to(FRONTEND_DIST) and requested_file.is_file():
            return FileResponse(requested_file)
        return FileResponse(FRONTEND_DIST / "index.html")
