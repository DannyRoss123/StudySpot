from __future__ import annotations

import os
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import Body, Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload, selectinload

from . import models, schemas
from .database import get_db, init_db
from .seed_data import SEED_SPACES
from .seed_spaces import seed_spaces as seed_spaces_util

RECENT_CHECKIN_WINDOW_MINUTES = 30
OCCUPANCY_DECAY_MINUTES = 30
ANALYTICS_LOOKBACK_DAYS = int(os.getenv("ANALYTICS_LOOKBACK_DAYS", "7"))
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "changeme")

CROWDING_SCORE = {"empty": 1, "some": 2, "full": 3}
CROWDING_UTIL_SCORE = {"empty": 0.0, "some": 0.5, "full": 1.0}

origins = [origin.strip() for origin in FRONTEND_ORIGINS.split(",") if origin.strip()]
allow_origins = origins or ["*"]

app = FastAPI(
    title="StudySpaces API",
    version="0.1.0",
    description="API powering StudySpaces, a real-time campus study space finder.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def verify_admin(x_admin_token: Optional[str] = Header(None)) -> None:
    """Simple header-based guard for admin-only routes."""
    expected = ADMIN_TOKEN
    if not expected:
        return
    if x_admin_token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin token.")


def _build_space_response(space: models.StudySpace, now: datetime) -> schemas.StudySpaceResponse:
    """Attach derived metrics (freshness, occupancy) to a StudySpace record."""
    checkins = sorted(space.checkins, key=lambda c: c.timestamp, reverse=True)
    latest = checkins[0] if checkins else None
    last_updated_minutes: Optional[int] = None
    occupancy_score: Optional[float] = None
    recent_noise = None
    recent_crowding = None
    recent_outlets = None

    if latest:
        delta_minutes = max(0, int((now - latest.timestamp).total_seconds() // 60))
        last_updated_minutes = delta_minutes
        recent_noise = latest.noise_level
        recent_crowding = latest.crowding
        recent_outlets = latest.outlets_available

        decay_factor = 1 + ((now - latest.timestamp).total_seconds() / (OCCUPANCY_DECAY_MINUTES * 60))
        recent_window = now - timedelta(minutes=RECENT_CHECKIN_WINDOW_MINUTES)
        recent_checkins = [c for c in checkins if c.timestamp >= recent_window]
        score_numerator = CROWDING_SCORE[latest.crowding] + len(recent_checkins)
        occupancy_score = round(score_numerator / decay_factor, 2)

    return schemas.StudySpaceResponse(
        id=space.id,
        name=space.name,
        building=space.building,
        floor=space.floor,
        latitude=space.latitude,
        longitude=space.longitude,
        capacity=space.capacity,
        created_at=space.created_at,
        last_updated_minutes=last_updated_minutes,
        recent_noise_level=recent_noise,
        recent_crowding=recent_crowding,
        recent_outlets=recent_outlets,
        occupancy_score=occupancy_score,
    )


def _get_space_or_404(space_id: int, db: Session) -> models.StudySpace:
    space = (
        db.query(models.StudySpace)
        .options(selectinload(models.StudySpace.checkins))
        .filter(models.StudySpace.id == space_id)
        .first()
    )
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study space not found.")
    return space


@app.get("/spaces", response_model=List[schemas.StudySpaceResponse])
def list_spaces(db: Session = Depends(get_db)) -> List[schemas.StudySpaceResponse]:
    spaces = (
        db.query(models.StudySpace)
        .options(selectinload(models.StudySpace.checkins))
        .order_by(models.StudySpace.name)
        .all()
    )
    now = datetime.utcnow()
    return [_build_space_response(space, now) for space in spaces]


@app.get("/spaces/{space_id}", response_model=schemas.SpaceDetailResponse)
def get_space(space_id: int, db: Session = Depends(get_db)) -> schemas.SpaceDetailResponse:
    now = datetime.utcnow()
    space = _get_space_or_404(space_id, db)
    recent_cutoff = now - timedelta(minutes=RECENT_CHECKIN_WINDOW_MINUTES)
    recent_checkins = [
        checkin
        for checkin in space.checkins
        if checkin.timestamp >= recent_cutoff
    ]
    recent_checkins.sort(key=lambda c: c.timestamp, reverse=True)
    return schemas.SpaceDetailResponse(
        space=_build_space_response(space, now),
        recent_checkins=[schemas.CheckInResponse.from_orm(checkin) for checkin in recent_checkins],
    )


@app.get("/spaces/{space_id}/recent-checkins", response_model=List[schemas.CheckInResponse])
def recent_checkins(space_id: int, db: Session = Depends(get_db)) -> List[schemas.CheckInResponse]:
    _ = _get_space_or_404(space_id, db)
    checkins = (
        db.query(models.CheckIn)
        .filter(models.CheckIn.space_id == space_id)
        .order_by(desc(models.CheckIn.timestamp))
        .limit(10)
        .all()
    )
    return [schemas.CheckInResponse.from_orm(checkin) for checkin in checkins]


@app.post("/check-in", response_model=schemas.CheckInResponse, status_code=status.HTTP_201_CREATED)
def create_checkin(payload: schemas.CheckInCreate, db: Session = Depends(get_db)) -> schemas.CheckInResponse:
    _ = _get_space_or_404(payload.space_id, db)
    user_id = payload.user_id or f"anon-{uuid.uuid4().hex[:8]}"
    checkin = models.CheckIn(
        space_id=payload.space_id,
        noise_level=payload.noise_level.value,
        crowding=payload.crowding.value,
        outlets_available=payload.outlets_available.value,
        notes=payload.notes,
        user_id=user_id,
        timestamp=datetime.utcnow(),
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return schemas.CheckInResponse.from_orm(checkin)


@app.delete("/check-ins/{checkin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checkin(
    checkin_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
) -> None:
    checkin = db.get(models.CheckIn, checkin_id)
    if not checkin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found.")
    db.delete(checkin)
    db.commit()


@app.post("/seed-spaces")
def seed_spaces_endpoint(
    payload: Optional[List[schemas.StudySpaceCreate]] = Body(None),
    _: None = Depends(verify_admin),
) -> Dict[str, int]:
    spaces_to_seed = [space.dict() for space in payload] if payload else SEED_SPACES
    inserted = seed_spaces_util(spaces_to_seed)
    return {"requested": len(spaces_to_seed), "inserted": inserted}


@app.get("/analytics/peak-times", response_model=List[schemas.PeakTimeRecord])
def analytics_peak_times(db: Session = Depends(get_db)) -> List[schemas.PeakTimeRecord]:
    now = datetime.utcnow()
    cutoff = now - timedelta(days=ANALYTICS_LOOKBACK_DAYS)
    checkins = (
        db.query(models.CheckIn)
        .options(joinedload(models.CheckIn.space))
        .filter(models.CheckIn.timestamp >= cutoff)
        .all()
    )
    counts: defaultdict[tuple[int, datetime], int] = defaultdict(int)
    for checkin in checkins:
        hour_bucket = checkin.timestamp.replace(minute=0, second=0, microsecond=0)
        counts[(checkin.space_id, hour_bucket)] += 1

    results: List[schemas.PeakTimeRecord] = []
    spaces = db.query(models.StudySpace).all()
    for space in spaces:
        best_hour = None
        best_count = 0
        for (space_id, hour), count in counts.items():
            if space_id != space.id:
                continue
            if count > best_count:
                best_hour = hour
                best_count = count
        results.append(
            schemas.PeakTimeRecord(
                space_id=space.id,
                space_name=space.name,
                peak_hour_start=best_hour,
                checkins_during_peak=best_count,
            )
        )
    return results


@app.get("/analytics/space-utilization", response_model=List[schemas.SpaceUtilizationRecord])
def analytics_space_utilization(db: Session = Depends(get_db)) -> List[schemas.SpaceUtilizationRecord]:
    spaces = (
        db.query(models.StudySpace)
        .options(selectinload(models.StudySpace.checkins))
        .order_by(models.StudySpace.name)
        .all()
    )
    records: List[schemas.SpaceUtilizationRecord] = []
    for space in spaces:
        checkins = space.checkins
        noise_counts = Counter(checkin.noise_level for checkin in checkins)
        noise_distribution = {level: noise_counts.get(level, 0) for level in models.NOISE_LEVELS}

        if checkins:
            avg_score = sum(CROWDING_UTIL_SCORE[checkin.crowding] for checkin in checkins) / len(checkins)
            avg_score = round(avg_score, 2)
            crowding_counts = Counter(checkin.crowding for checkin in checkins)
            dominant_crowding_label = crowding_counts.most_common(1)[0][0]
        else:
            avg_score = None
            dominant_crowding_label = None

        records.append(
            schemas.SpaceUtilizationRecord(
                space_id=space.id,
                space_name=space.name,
                avg_crowding_score=avg_score,
                dominant_crowding_label=dominant_crowding_label,
                noise_distribution=noise_distribution,
            )
        )
    return records


@app.get("/")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok", "service": "studyspaces-api"}
