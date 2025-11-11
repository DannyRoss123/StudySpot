from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class NoiseLevel(str, Enum):
    quiet = "quiet"
    moderate = "moderate"
    loud = "loud"


class CrowdingLevel(str, Enum):
    empty = "empty"
    some = "some"
    full = "full"


class OutletAvailability(str, Enum):
    yes = "yes"
    some = "some"
    no = "no"


class StudySpaceBase(BaseModel):
    name: str
    building: str
    floor: Optional[str] = None
    latitude: float
    longitude: float
    capacity: Optional[int] = Field(None, ge=1)


class StudySpaceCreate(StudySpaceBase):
    pass


class StudySpaceResponse(StudySpaceBase):
    id: int
    created_at: datetime
    last_updated_minutes: Optional[int] = None
    recent_noise_level: Optional[NoiseLevel] = None
    recent_crowding: Optional[CrowdingLevel] = None
    recent_outlets: Optional[OutletAvailability] = None
    occupancy_score: Optional[float] = None

    class Config:
        orm_mode = True


class CheckInBase(BaseModel):
    space_id: int
    noise_level: NoiseLevel
    crowding: CrowdingLevel
    outlets_available: OutletAvailability
    notes: Optional[str] = Field(None, max_length=500)
    user_id: Optional[str] = Field(None, max_length=64)

    @validator("user_id")
    def validate_user_id(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("user_id cannot be empty")
        return value


class CheckInCreate(CheckInBase):
    pass


class CheckInResponse(CheckInBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True


class SpaceDetailResponse(BaseModel):
    space: StudySpaceResponse
    recent_checkins: List[CheckInResponse]


class PeakTimeRecord(BaseModel):
    space_id: int
    space_name: str
    peak_hour_start: Optional[datetime]
    checkins_during_peak: int


class SpaceUtilizationRecord(BaseModel):
    space_id: int
    space_name: str
    avg_crowding_score: Optional[float]
    dominant_crowding_label: Optional[CrowdingLevel]
    noise_distribution: dict[str, int]
