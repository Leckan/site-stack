"""Unit tests for SiteStack FastMCP Maryland geospatial, zoning, HUD SAFMR, and transit tools."""

from __future__ import annotations

import os
import pytest

from tools.hud_safmr import get_hud_safmr_limits
from tools.mta_transit import compute_transit_isochrone
from tools.sdat_gis import get_parcel_spatial_record
from tools.zoning_rules import check_maryland_tod_qualification


@pytest.fixture(autouse=True)
def force_offline_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure deterministic offline execution during unit tests."""
    monkeypatch.setenv("SITESTACK_OFFLINE_MODE", "1")


@pytest.mark.asyncio
async def test_get_parcel_spatial_record_silver_spring() -> None:
    record = await get_parcel_spatial_record("24031", "13-00984210")
    assert record["account_number"] == "13-00984210"
    assert record["county_fips"] == "24031"
    assert record["county_name"] == "Montgomery County"
    assert record["lot_sqft"] == 42500
    assert record["boundary_geojson"]["type"] == "Polygon"
    assert len(record["boundary_geojson"]["coordinates"][0]) == 5


def test_check_maryland_tod_qualification_tier1() -> None:
    # Silver Spring parcel within 0.5 miles of Silver Spring Transit Center
    res = check_maryland_tod_qualification(
        latitude=38.9944,
        longitude=-77.0261,
        current_zoning="CR-3.0 C-2.0 R-2.75 H-90 T",
    )
    assert res["qualified"] is True
    assert res["tod_tier"] == "TIER_1_HALF_MILE"
    assert res["density_bonus_pct"] == 30
    assert res["height_bonus_feet"] == 30
    assert res["parking_minimum_reduction_pct"] == 100
    assert res["mandatory_affordability_pct"] == 15
    assert res["by_right_approval_eligible"] is True


def test_check_maryland_tod_qualification_non_tod() -> None:
    # Rural parcel far from rail stations
    res = check_maryland_tod_qualification(
        latitude=38.5500,
        longitude=-76.1500,
        current_zoning="R-1",
    )
    assert res["qualified"] is False
    assert res["tod_tier"] == "NON_TOD"
    assert res["density_bonus_pct"] == 0


@pytest.mark.asyncio
async def test_get_hud_safmr_limits_montgomery_and_baltimore() -> None:
    moco = await get_hud_safmr_limits("20910", 2025)
    assert moco["zip_code"] == "20910"
    assert moco["safmr_by_bedroom"]["two_bed"] == 2450
    assert "ami_60" in moco["ami_max_rents_by_tier"]
    assert moco["ami_max_rents_by_tier"]["ami_60"]["two_bed"] > 1500

    bmore = await get_hud_safmr_limits("21201", 2025)
    assert bmore["zip_code"] == "21201"
    assert bmore["safmr_by_bedroom"]["two_bed"] == 1890


@pytest.mark.asyncio
async def test_compute_transit_isochrone_contours() -> None:
    iso = await compute_transit_isochrone(38.9944, -77.0261, [15, 30, 45])
    assert iso["type"] == "FeatureCollection"
    assert iso["cutoffs_minutes"] == [15, 30, 45]
    assert len(iso["features"]) == 3
    first_feat = iso["features"][0]
    assert first_feat["properties"]["cutoff_minutes"] == 15
    assert first_feat["geometry"]["type"] == "Polygon"

