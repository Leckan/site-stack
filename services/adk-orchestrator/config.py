"""Vertex AI & Environment Configuration for Google ADK Multi-Agent Service."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class OrchestratorConfig:
    """Runtime configuration for Vertex AI Gemini and FastMCP connectivity."""

    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "sitestack-md-enterprise")
    google_cloud_location: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east4")
    adk_model_name: str = os.getenv("ADK_MODEL_NAME", "gemini-1.5-pro")
    mcp_server_sse_url: str = os.getenv("MCP_SERVER_SSE_URL", "http://localhost:8001/sse")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    port: int = int(os.getenv("PORT", "8002"))


settings = OrchestratorConfig()

