# SiteStack Google ADK Multi-Agent Orchestrator

Implements the `DevelopmentFeasibilityCoordinator` supervisor and 3 specialized sub-agents (`ZoningEntitlementAgent`, `FinancialProFormaAgent`, `TransitSiteImpactAgent`) built on `google.adk` and `gemini-1.5-pro` on Vertex AI, streaming real-time reasoning steps and MCP tool invocations over Server-Sent Events (SSE) and WebSockets.

