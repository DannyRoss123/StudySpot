from __future__ import annotations

from typing import Sequence

from .database import init_db, session_scope
from .models import StudySpace
from .seed_data import SEED_SPACES


def seed_spaces(spaces: Sequence[dict]) -> int:
    init_db()
    with session_scope() as session:
        existing_names = {
            name for (name,) in session.query(StudySpace.name).filter(StudySpace.name.in_([s["name"] for s in spaces])).all()
        }
        created = 0
        for payload in spaces:
            if payload["name"] in existing_names:
                continue
            session.add(StudySpace(**payload))
            created += 1
    return created


if __name__ == "__main__":
    inserted = seed_spaces(SEED_SPACES)
    print(f"Seeded {inserted} study spaces.")
