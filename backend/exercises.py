"""Seed exercise data and simple recommendation logic based on weak-skill tags."""
from sqlalchemy.orm import Session

from database import Exercise

SEED_EXERCISES = [
    {
        "tag": "contrast",
        "title": "Value Study in 5 Steps",
        "description": "Draw the same object using only 5 flat tones (black, dark gray, "
        "mid gray, light gray, white) to train your eye on tonal contrast.",
        "difficulty": "beginner",
    },
    {
        "tag": "contrast",
        "title": "Chiaroscuro Still Life",
        "description": "Set up a single strong light source and paint a still life "
        "emphasizing deep shadows and bright highlights.",
        "difficulty": "intermediate",
    },
    {
        "tag": "composition",
        "title": "Rule-of-Thirds Thumbnails",
        "description": "Sketch 6 tiny thumbnail compositions of the same scene, placing "
        "the focal point on a different third-line intersection each time.",
        "difficulty": "beginner",
    },
    {
        "tag": "composition",
        "title": "Leading Lines Exercise",
        "description": "Redesign one of your recent pieces so at least one strong line "
        "guides the viewer's eye toward the focal point.",
        "difficulty": "intermediate",
    },
    {
        "tag": "color_balance",
        "title": "Complementary Color Wheel Study",
        "description": "Paint a small swatch grid mixing complementary color pairs to "
        "practice neutralizing unwanted color casts.",
        "difficulty": "beginner",
    },
    {
        "tag": "saturation",
        "title": "Grayscale-to-Color Underpainting",
        "description": "Block in a grayscale underpainting first, then glaze thin color "
        "layers on top to control saturation deliberately.",
        "difficulty": "intermediate",
    },
    {
        "tag": "line_quality",
        "title": "50 Confident Lines Warm-up",
        "description": "Draw 50 straight and curved lines in one continuous stroke each, "
        "focusing on confident, unbroken linework before every session.",
        "difficulty": "beginner",
    },
    {
        "tag": "line_quality",
        "title": "Contour Drawing Without Looking",
        "description": "Do a 5-minute blind contour drawing of an object without looking "
        "at the paper, to build hand-eye coordination for cleaner lines.",
        "difficulty": "beginner",
    },
    {
        "tag": "brightness",
        "title": "High-Key / Low-Key Pair",
        "description": "Paint the same subject twice: once high-key (mostly light tones) "
        "and once low-key (mostly dark tones) to explore brightness range.",
        "difficulty": "intermediate",
    },
]


def seed_exercises(db: Session) -> None:
    if db.query(Exercise).count() > 0:
        return
    for item in SEED_EXERCISES:
        db.add(Exercise(**item))
    db.commit()


def recommend_exercises(db: Session, weak_tags: list[str], limit: int = 3) -> list[Exercise]:
    """Pick exercises matching the artist's weakest-scoring metrics."""
    results: list[Exercise] = []
    for tag in weak_tags:
        matches = db.query(Exercise).filter(Exercise.tag == tag).all()
        results.extend(matches)
        if len(results) >= limit:
            break
    # de-duplicate while preserving order
    seen = set()
    deduped = []
    for ex in results:
        if ex.id not in seen:
            seen.add(ex.id)
            deduped.append(ex)
    return deduped[:limit]
