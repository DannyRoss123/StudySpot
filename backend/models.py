from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base

NOISE_LEVELS = ("quiet", "moderate", "loud")
CROWDING_LEVELS = ("empty", "some", "full")
OUTLETS_LEVELS = ("yes", "some", "no")


class StudySpace(Base):
    __tablename__ = "study_spaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True)
    building = Column(String(120), nullable=False)
    floor = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    checkins = relationship(
        "CheckIn", back_populates="space", cascade="all, delete-orphan", lazy="joined"
    )


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("study_spaces.id", ondelete="CASCADE"), nullable=False)
    noise_level = Column(
        Enum(*NOISE_LEVELS, name="noise_level"),
        nullable=False,
    )
    crowding = Column(
        Enum(*CROWDING_LEVELS, name="crowding_level"),
        nullable=False,
    )
    outlets_available = Column(
        Enum(*OUTLETS_LEVELS, name="outlets_level"),
        nullable=False,
    )
    notes = Column(Text, nullable=True)
    user_id = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    space = relationship("StudySpace", back_populates="checkins")
