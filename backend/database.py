"""SQLAlchemy models and DB session setup for NilavuArtStudio."""
import os
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    inspect,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nilavuart.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False, default="demo-user")
    filename = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)
    storage_public_id = Column(String(255), nullable=True)
    title = Column(String, default="Untitled")
    author_name = Column(String(100), nullable=False, default="Jerusha Arun")
    exercise_tag = Column(String, nullable=True)  # e.g. "shading", "perspective"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    feedback = relationship(
        "Feedback", back_populates="artwork", uselist=False, cascade="all, delete-orphan"
    )
    narrative_feedback = relationship(
        "NarrativeFeedback", back_populates="artwork", uselist=False, cascade="all, delete-orphan"
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    artwork_id = Column(Integer, ForeignKey("artworks.id"), nullable=False)

    overall_score = Column(Float, nullable=False)
    brightness_score = Column(Float, nullable=False)
    contrast_score = Column(Float, nullable=False)
    color_balance_score = Column(Float, nullable=False)
    composition_score = Column(Float, nullable=False)
    line_quality_score = Column(Float, nullable=False)
    saturation_score = Column(Float, nullable=False)

    summary = Column(Text, nullable=False)
    suggestions_json = Column(Text, nullable=False)  # JSON-encoded list[str]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    artwork = relationship("Artwork", back_populates="feedback")


class NarrativeFeedback(Base):
    __tablename__ = "narrative_feedback"

    id = Column(Integer, primary_key=True, index=True)
    artwork_id = Column(Integer, ForeignKey("artworks.id"), unique=True, nullable=False)
    narrative = Column(Text, nullable=False)
    strengths_json = Column(Text, nullable=False)
    growth_areas_json = Column(Text, nullable=False)
    next_steps_json = Column(Text, nullable=False)
    recommended_exercise = Column(Text, nullable=False)
    title_suggestions_json = Column(Text, nullable=True)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    artwork = relationship("Artwork", back_populates="narrative_feedback")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String, index=True, nullable=False)  # matches weak-skill tag
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, default="beginner")  # beginner/intermediate/advanced


class SiteFeedback(Base):
    __tablename__ = "site_feedback"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(50), nullable=False, default="Anonymous")
    category = Column(String(30), nullable=False, default="general")
    rating = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    if "artworks" in inspector.get_table_names():
        artwork_columns = {column["name"] for column in inspector.get_columns("artworks")}
        if "author_name" not in artwork_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE artworks ADD COLUMN author_name VARCHAR(100)")
                )
                connection.execute(
                    text("UPDATE artworks SET author_name = 'Jerusha Arun'")
                )
        if "image_url" not in artwork_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE artworks ADD COLUMN image_url TEXT"))
        if "storage_public_id" not in artwork_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE artworks ADD COLUMN storage_public_id VARCHAR(255)")
                )
    if "narrative_feedback" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("narrative_feedback")}
        if "title_suggestions_json" not in columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE narrative_feedback ADD COLUMN title_suggestions_json TEXT")
                )


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
