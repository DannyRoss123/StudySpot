from __future__ import annotations

from typing import List, TypedDict


class SpaceSeed(TypedDict):
    name: str
    building: str
    floor: str | None
    latitude: float
    longitude: float
    capacity: int


SEED_SPACES: List[SpaceSeed] = [
    {
        "name": "Perkins Library Reading Room",
        "building": "Perkins Library",
        "floor": "2",
        "latitude": 36.0012,
        "longitude": -78.9395,
        "capacity": 120,
    },
    {
        "name": "Bostock Library Commons",
        "building": "Bostock Library",
        "floor": "1",
        "latitude": 36.0016,
        "longitude": -78.9389,
        "capacity": 90,
    },
    {
        "name": "The Edge Spark Lab",
        "building": "Bostock Library",
        "floor": "1",
        "latitude": 36.0017,
        "longitude": -78.9385,
        "capacity": 60,
    },
    {
        "name": "Rubenstein Library Court",
        "building": "Rubenstein Library",
        "floor": "1",
        "latitude": 36.0019,
        "longitude": -78.9392,
        "capacity": 40,
    },
    {
        "name": "Lilly Library Quiet Study",
        "building": "Lilly Library (East Campus)",
        "floor": "2",
        "latitude": 36.0085,
        "longitude": -78.9108,
        "capacity": 80,
    },
    {
        "name": "The Commons Seating",
        "building": "Brodhead Center",
        "floor": "2",
        "latitude": 36.001,
        "longitude": -78.937,
        "capacity": 70,
    },
    {
        "name": "Marketplace Loft Tables",
        "building": "Marketplace",
        "floor": "Mezzanine",
        "latitude": 36.0078,
        "longitude": -78.9142,
        "capacity": 55,
    },
    {
        "name": "Gross Hall Atrium",
        "building": "Gross Hall",
        "floor": "1",
        "latitude": 36.0015,
        "longitude": -78.9443,
        "capacity": 65,
    },
    {
        "name": "Sanford School Lounge",
        "building": "Sanford School",
        "floor": "1",
        "latitude": 36.0029,
        "longitude": -78.9417,
        "capacity": 50,
    },
    {
        "name": "Bryan Center Landing",
        "building": "Bryan Center",
        "floor": "2",
        "latitude": 36.0004,
        "longitude": -78.9421,
        "capacity": 75,
    },
    {
        "name": "CIEMAS Atrium Tables",
        "building": "Fitzpatrick CIEMAS",
        "floor": "1",
        "latitude": 36.0025,
        "longitude": -78.9449,
        "capacity": 60,
    },
    {
        "name": "French Family Science Commons",
        "building": "French Family Science Center",
        "floor": "1",
        "latitude": 36.0011,
        "longitude": -78.9426,
        "capacity": 70,
    },
    {
        "name": "Trent Semans Café Tables",
        "building": "Trent Semans Center",
        "floor": "1",
        "latitude": 36.0071,
        "longitude": -78.9398,
        "capacity": 45,
    },
    {
        "name": "West Union Patio",
        "building": "Brodhead Center",
        "floor": "Outdoor",
        "latitude": 36.0008,
        "longitude": -78.9375,
        "capacity": 40,
    },
    {
        "name": "Wilson Recreation Lounge",
        "building": "Wilson Recreation Center",
        "floor": "Lobby",
        "latitude": 36.0028,
        "longitude": -78.9477,
        "capacity": 35,
    },
]
