"""FastMCP SSE Server Entrypoint for SiteStack Maryland Geospatial & Housing Tools."""

from __future__ import annotations

import os
from typing import Any

from fastmcp import FastMCP

from tools.hud_safmr import get_hud_safmr_limits as _get_hud_safmr_limits
from tools.mta_transit import compute_transit_isochrone as _compute_transit_isochrone
from tools.sdat_gis import get_parcel_spatial_record as _get_parcel_spatial_record
from tools.zoning_rules import check_maryland_tod_qualification as _check_maryland_tod_qualification

mcp = FastMCP("SiteStack Maryland Entitlement & Geospatial MCP Server")


@mcp.tool()
async def get_parcel_spatial_record(county_fips: str, account_number: str) -> dict[str, Any]:
    """Query Maryland Department of Planning (MDP) SDAT ArcGIS MapServer for parcel geometry, zoning, and assessment."""
    return await _get_parcel_spatial_record(county_fips=county_fips, account_number=account_number)


@mcp.tool()
def check_maryland_tod_qualification(
    latitude: float,
    longitude: float,
    current_zoning: str,
) -> dict[str, Any]:
    """Evaluate statutory density bonuses, height uplifts, and parking waivers under the Maryland Housing Expansion and Affordability Act of 2024 (HB 538)."""
    return _check_maryland_tod_qualification(
        latitude=latitude,
        longitude=longitude,
        current_zoning=current_zoning,
    )


@mcp.tool()
async def get_hud_safmr_limits(zip_code: str, fiscal_year: int = 2025) -> dict[str, Any]:
    """Fetch HUD Small Area Fair Market Rents (SAFMR) and Maryland AMI income/rent caps (30%, 50%, 60%, 80%)."""
    return await _get_hud_safmr_limits(zip_code=zip_code, fiscal_year=fiscal_year)


@mcp.tool()
async def compute_transit_isochrone(
    origin_lat: float,
    origin_lng: float,
    cutoffs: list[int],
) -> dict[str, Any]:
    """Compute morning peak transit commute travel-time contour polygons via Google Maps Routes API v2 or MTA GTFS-RT."""
    return await _compute_transit_isochrone(
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        cutoffs=cutoffs,
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    mcp.run(transport="sse", host="0.0.0.0", port=port)

