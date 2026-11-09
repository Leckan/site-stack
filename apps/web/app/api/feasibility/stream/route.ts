import type { ParcelRecord, ProFormaParameters } from "@sitestack/ts-types";
import { NextRequest } from "next/server";
import {
  MARYLAND_SEED_PARCELS,
  buildFeasibilityRunSummary,
} from "@/lib/proforma-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parcel: ParcelRecord = body.parcel ?? MARYLAND_SEED_PARCELS[0];
  const params: ProFormaParameters = body.params ?? {
    targetAmiMixPct: 40,
    weightedAmiTier: 60,
    constructionType: "TYPE_V_WOOD",
    parkingRatioPerUnit: 0.25,
    useTodBonus: true,
    pilotAbatementEnabled: true,
  };

  const adkUrl = process.env.ADK_ORCHESTRATOR_URL || "http://localhost:8002";

  // Try proxying to live Python Google ADK Orchestrator if reachable
  try {
    const upstream = await fetch(`${adkUrl}/api/feasibility/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: parcel.id,
        account_id: parcel.accountId,
        county_fips: parcel.countyFips,
        address: parcel.address,
        zip_code: parcel.zipCode,
        zoning_code: parcel.zoningCode,
        lot_sqft: parcel.lotSqft,
        assessed_value_usd: parcel.assessedValueUsd,
        nearest_station: parcel.nearestStation,
        distance_to_transit_miles: parcel.distanceToTransitMiles,
        chesapeake_critical_area: parcel.chesapeakeCriticalArea,
        base_allowable_far: parcel.baseAllowableFar,
        max_height_feet: parcel.maxHeightFeet,
        target_ami_mix_pct: params.targetAmiMixPct,
        weighted_ami_tier: params.weightedAmiTier,
        construction_type: params.constructionType,
        parking_ratio: params.parkingRatioPerUnit,
      }),
      signal: AbortSignal.timeout(1800),
    });

    if (upstream.ok && upstream.body) {
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }
  } catch {
    // Fall back to deterministic in-process SSE stream so UI works seamlessly offline
  }

  const summary = buildFeasibilityRunSummary(parcel, params);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const step of summary.steps) {
        const chunk = `event: agent_step\ndata: ${JSON.stringify(step)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 85));
      }
      const finalChunk = `event: feasibility_result\ndata: ${JSON.stringify(summary)}\n\n`;
      controller.enqueue(encoder.encode(finalChunk));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

