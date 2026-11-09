"""Maryland Housing Expansion and Affordability Act of 2024 (HB 538) Statutory Logic."""

from __future__ import annotations

import math
from typing import Any

from pydantic import BaseModel, Field

# Authoritative Maryland Passenger Rail & Transit Stations (WMATA, MARC, MTA Metro/Light Rail/Purple Line)
MARYLAND_TRANSIT_STATIONS: list[dict[str, Any]] = [
    {
        "name": "Silver Spring Transit Center (WMATA Red / MARC / Purple Line)",
        "agency": "WMATA",
        "lat": 38.9938,
        "lng": -77.0314,
    },
    {
        "name": "North Bethesda Metro Station (WMATA Red Line)",
        "agency": "WMATA",
        "lat": 39.0480,
        "lng": -77.1131,
    },
    {
        "name": "Bethesda Metro & Purple Line Station",
        "agency": "WMATA",
        "lat": 38.9845,
        "lng": -77.0942,
    },
    {
        "name": "Hyattsville Crossing Metro Station (WMATA Green Line)",
        "agency": "WMATA",
        "lat": 38.9653,
        "lng": -76.9562,
    },
    {
        "name": "College Park - U of Md Station (WMATA Green / MARC Camden / Purple Line)",
        "agency": "WMATA",
        "lat": 38.9785,
        "lng": -76.9284,
    },
    {
        "name": "New Carrollton Station (WMATA Orange / MARC Penn / Amtrak / Purple Line)",
        "agency": "MTA_MARC",
        "lat": 38.9480,
        "lng": -76.8719,
    },
    {
        "name": "Baltimore Penn Station (MARC Penn Line / MTA Light Rail)",
        "agency": "MTA_MARC",
        "lat": 39.3074,
        "lng": -76.6156,
    },
    {
        "name": "State Center / Cultural Center (MTA Metro SubwayLink & Light Rail)",
        "agency": "MTA_METRO",
        "lat": 39.3016,
        "lng": -76.6215,
    },
    {
        "name": "Camden Station Baltimore (MARC Camden / MTA Light Rail)",
        "agency": "MTA_LIGHT_RAIL",
        "lat": 39.2839,
        "lng": -76.6197,
    },
]


class MarylandTodQualificationResult(BaseModel):
    """Statutory evaluation under Maryland HB 538 (Housing Expansion and Affordability Act of 2024)."""

    qualified: bool
    statutory_act: str = "Maryland Housing Expansion and Affordability Act of 2024 (HB 538)"
    latitude: float
    longitude: float
    current_zoning: str
    nearest_station_name: str
    nearest_station_agency: str
    distance_miles: float = Field(..., description="Great-circle distance to nearest qualifying station")
    tod_tier: str = Field(..., description="TIER_1_HALF_MILE, TIER_2_THREE_QUARTER_MILE, or NON_TOD")
    density_bonus_pct: int = Field(..., description="Statutory density uplift percentage (up to 30%)")
    height_bonus_feet: int = Field(..., description="Additional statutory height allowance in feet")
    parking_minimum_reduction_pct: int = Field(..., description="Statutory off-street parking reduction %")
    mandatory_affordability_pct: int = Field(..., description="Required % of income-restricted units")
    target_ami_pct: int = Field(..., description="Target Area Median Income cap (60% AMI)")
    by_right_approval_eligible: bool
    statutory_citations: list[str]


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_miles = 3958.7613
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return earth_radius_miles * (2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)))


def check_maryland_tod_qualification(
    latitude: float,
    longitude: float,
    current_zoning: str,
) -> dict[str, Any]:
    """Evaluate a parcel's eligibility under the Maryland Housing Expansion and Affordability Act of 2024.

    Under MD Land Use Article § 7-105 (HB 538):
    - Parcels within 0.75 miles of a passenger rail/transit station qualify as Transit-Oriented Development.
    - Tier 1 (<= 0.50 miles): 30% statutory density bonus, +30 ft height uplift, 100% parking minimum waiver,
      with 15% of units reserved at <= 60% AMI.
    - Tier 2 (0.50 to 0.75 miles): 25% statutory density bonus, +20 ft height uplift, 50% parking reduction,
      with 15% of units reserved at <= 60% AMI.
    """
    nearest_station = None
    min_distance = float("inf")

    for station in MARYLAND_TRANSIT_STATIONS:
        dist = _haversine_miles(latitude, longitude, station["lat"], station["lng"])
        if dist < min_distance:
            min_distance = dist
            nearest_station = station

    assert nearest_station is not None
    rounded_dist = round(min_distance, 3)

    zoning_upper = current_zoning.upper()
    is_restricted_heavy_industrial = zoning_upper.startswith("I-H") or "HEAVY INDUSTRIAL" in zoning_upper

    if rounded_dist <= 0.50 and not is_restricted_heavy_industrial:
        result = MarylandTodQualificationResult(
            qualified=True,
            latitude=latitude,
            longitude=longitude,
            current_zoning=current_zoning,
            nearest_station_name=nearest_station["name"],
            nearest_station_agency=nearest_station["agency"],
            distance_miles=rounded_dist,
            tod_tier="TIER_1_HALF_MILE",
            density_bonus_pct=30,
            height_bonus_feet=30,
            parking_minimum_reduction_pct=100,
            mandatory_affordability_pct=15,
            target_ami_pct=60,
            by_right_approval_eligible=True,
            statutory_citations=[
                "MD Land Use Code Ann. § 7-105 (HB 538, 2024)",
                "30% density preemption bonus for Tier 1 (<0.50 mi of MARC/WMATA/MTA station)",
                "Administrative by-right site plan review without discretionary downzoning",
            ],
        )
    elif rounded_dist <= 0.75 and not is_restricted_heavy_industrial:
        result = MarylandTodQualificationResult(
            qualified=True,
            latitude=latitude,
            longitude=longitude,
            current_zoning=current_zoning,
            nearest_station_name=nearest_station["name"],
            nearest_station_agency=nearest_station["agency"],
            distance_miles=rounded_dist,
            tod_tier="TIER_2_THREE_QUARTER_MILE",
            density_bonus_pct=25,
            height_bonus_feet=20,
            parking_minimum_reduction_pct=50,
            mandatory_affordability_pct=15,
            target_ami_pct=60,
            by_right_approval_eligible=True,
            statutory_citations=[
                "MD Land Use Code Ann. § 7-105 (HB 538, 2024)",
                "25% density bonus within 0.75-mile transit station catchment",
                "50% statutory reduction in municipal off-street parking minimums",
            ],
        )
    else:
        result = MarylandTodQualificationResult(
            qualified=False,
            latitude=latitude,
            longitude=longitude,
            current_zoning=current_zoning,
            nearest_station_name=nearest_station["name"],
            nearest_station_agency=nearest_station["agency"],
            distance_miles=rounded_dist,
            tod_tier="NON_TOD",
            density_bonus_pct=0,
            height_bonus_feet=0,
            parking_minimum_reduction_pct=0,
            mandatory_affordability_pct=10,
            target_ami_pct=80,
            by_right_approval_eligible=False,
            statutory_citations=[
                "Standard municipal zoning entitlement process applies (>0.75 mi from rail transit)",
            ],
        )

    return result.model_dump()

