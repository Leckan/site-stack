"use client";

import { GeoJsonLayer } from "@deck.gl/layers";
import type { ParcelRecord, TodTierStatus } from "@sitestack/ts-types";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Map3D,
  Pin,
} from "@vis.gl/react-google-maps";
import { Box, Compass, Layers, Radio, Sparkles, Train } from "lucide-react";
import React, { useMemo } from "react";
import { Badge, Switch } from "@/components/ui/primitives";
import { buildParcelFeatureCollection } from "@/lib/proforma-engine";
import { DeckGlOverlay } from "./deckgl-overlay";

interface GeospatialCanvasProps {
  parcels: ParcelRecord[];
  selectedParcel: ParcelRecord;
  photorealistic3dEnabled: boolean;
  showIsochrones: boolean;
  onSelectParcel: (parcel: ParcelRecord) => void;
  onToggle3d: (enabled: boolean) => void;
  onToggleIsochrones: (show: boolean) => void;
}

const TOD_FILL_COLORS: Record<TodTierStatus, [number, number, number, number]> = {
  DIRECT_TOD_BONUS: [16, 185, 129, 185], // Green = Direct TOD Bonus
  STANDARD_INFILL: [245, 158, 11, 185], // Yellow = Standard Infill
  ENVIRONMENTAL_RESTRICTION: [244, 63, 94, 185], // Red = Environmental Restriction
};

const TOD_LINE_COLORS: Record<TodTierStatus, [number, number, number, number]> = {
  DIRECT_TOD_BONUS: [52, 211, 153, 255],
  STANDARD_INFILL: [251, 191, 36, 255],
  ENVIRONMENTAL_RESTRICTION: [251, 113, 133, 255],
};

const TOD_PIN_HEX: Record<TodTierStatus, { bg: string; border: string }> = {
  DIRECT_TOD_BONUS: { bg: "#10b981", border: "#047857" },
  STANDARD_INFILL: { bg: "#f59e0b", border: "#b45309" },
  ENVIRONMENTAL_RESTRICTION: { bg: "#f43f5e", border: "#be123c" },
};

export function GeospatialCanvas({
  parcels,
  selectedParcel,
  photorealistic3dEnabled,
  showIsochrones,
  onSelectParcel,
  onToggle3d,
  onToggleIsochrones,
}: GeospatialCanvasProps) {
  const apiKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  const featureCollection = useMemo(
    () => buildParcelFeatureCollection(parcels),
    [parcels]
  );

  const deckLayers = useMemo(() => {
    return [
      new GeoJsonLayer({
        id: "maryland-sdat-parcels-layer",
        data: featureCollection,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: photorealistic3dEnabled,
        wireframe: photorealistic3dEnabled,
        lineWidthMinPixels: 2,
        getFillColor: (f: unknown) => {
          const feat = f as { properties?: { todStatus?: TodTierStatus } };
          const status = feat.properties?.todStatus ?? "STANDARD_INFILL";
          return TOD_FILL_COLORS[status];
        },
        getLineColor: (f: unknown) => {
          const feat = f as { properties?: { todStatus?: TodTierStatus } };
          const status = feat.properties?.todStatus ?? "STANDARD_INFILL";
          return TOD_LINE_COLORS[status];
        },
        getElevation: (f: unknown) => {
          if (!photorealistic3dEnabled) return 0;
          const feat = f as { properties?: { maxHeightFeet?: number; todStatus?: TodTierStatus } };
          const baseFt = feat.properties?.maxHeightFeet ?? 75;
          const bonusFt = feat.properties?.todStatus === "DIRECT_TOD_BONUS" ? 30 : 0;
          return (baseFt + bonusFt) * 0.3048;
        },
        onClick: (info: { object?: { properties?: { id?: string } } }) => {
          const clickedId = info.object?.properties?.id;
          if (clickedId) {
            const found = parcels.find((p) => p.id === clickedId);
            if (found) onSelectParcel(found);
          }
        },
      }),
    ];
  }, [featureCollection, onSelectParcel, parcels, photorealistic3dEnabled]);

  const [centerLng, centerLat] = selectedParcel.centroid.coordinates;

  return (
    <div className="relative flex-1 h-[calc(100vh-3.5rem)] min-h-[560px] w-full overflow-hidden bg-slate-950">
      {/* Top Floating Geospatial Control HUD */}
      <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/90 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
          <Compass className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white">Maryland SDAT + TOD Layer</span>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="toggle-3d-tiles"
            checked={photorealistic3dEnabled}
            onCheckedChange={onToggle3d}
            aria-label="Toggle Photorealistic 3D Tiles"
          />
          <label
            htmlFor="toggle-3d-tiles"
            className="cursor-pointer text-xs font-medium text-slate-200 flex items-center gap-1.5"
          >
            <Box className="h-3.5 w-3.5 text-sky-400" />
            Photorealistic 3D Tiles
          </label>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <Switch
            id="toggle-isochrones"
            checked={showIsochrones}
            onCheckedChange={onToggleIsochrones}
            aria-label="Toggle Transit Isochrones"
          />
          <label
            htmlFor="toggle-isochrones"
            className="cursor-pointer text-xs font-medium text-slate-200 flex items-center gap-1.5"
          >
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            15/30/45m Transit Isochrones
          </label>
        </div>
      </div>

      {/* Legend Pill Bar */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/90 px-3.5 py-2 text-xs shadow-xl backdrop-blur">
        <span className="font-semibold text-slate-300 flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          HB 538 Statutory Overlay:
        </span>
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Green = Direct TOD Bonus (+30% Density)
        </span>
        <span className="inline-flex items-center gap-1.5 text-amber-300">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Yellow = Standard Infill
        </span>
        <span className="inline-flex items-center gap-1.5 text-rose-300">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Red = Environmental Restriction (Critical Area)
        </span>
      </div>

      {/* Live Google Maps JavaScript SDK + Photorealistic 3D Tiles when API key is configured */}
      {apiKey ? (
        <APIProvider
          apiKey={apiKey}
          version={photorealistic3dEnabled ? "alpha" : "weekly"}
        >
          <div style={{ width: "100%", height: "100%" }}>
            {photorealistic3dEnabled ? (
              <Map3D
                internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
                mode="SATELLITE"
                defaultCenter={{ lat: centerLat, lng: centerLng, altitude: 110 }}
                defaultRange={950}
                defaultHeading={28}
                defaultTilt={65}
                defaultRoll={0}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Map
                internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
                mapId={mapId}
                defaultCenter={{ lat: centerLat, lng: centerLng }}
                defaultZoom={14}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: "100%", height: "100%" }}
              >
                <DeckGlOverlay layers={deckLayers} />
                {parcels.map((parcel) => {
                  const [lng, lat] = parcel.centroid.coordinates;
                  const pinColors = TOD_PIN_HEX[parcel.todStatus];
                  return (
                    <AdvancedMarker
                      key={parcel.id}
                      position={{ lat, lng }}
                      onClick={() => onSelectParcel(parcel)}
                    >
                      <Pin
                        background={pinColors.bg}
                        borderColor={pinColors.border}
                        glyphColor="#090d16"
                      />
                    </AdvancedMarker>
                  );
                })}
              </Map>
            )}
          </div>
        </APIProvider>
      ) : (
        /* Resilient Interactive Geospatial Fallback Canvas when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is unset */
        <div className="relative flex h-full w-full flex-col justify-between bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-6 pt-20">
          {/* Interactive SVG Spatial Viewport */}
          <div className="relative flex-1 rounded-2xl border border-slate-800/80 bg-slate-950/70 overflow-hidden flex items-center justify-center">
            <svg
              viewBox="0 0 900 540"
              className="h-full w-full object-cover"
              role="img"
              aria-label="Maryland Interactive Parcel & Transit Isochrone Canvas"
            >
              <defs>
                <pattern id="spatial-grid" width="45" height="45" patternUnits="userSpaceOnUse">
                  <path
                    d="M 45 0 L 0 0 0 45"
                    fill="none"
                    stroke="rgba(51, 65, 85, 0.35)"
                    strokeWidth="1"
                  />
                </pattern>
                <radialGradient id="iso-15" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.28)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.03)" />
                </radialGradient>
              </defs>

              <rect width="900" height="540" fill="url(#spatial-grid)" />

              {/* Simulated MARC / WMATA Red & Green Line / Purple Line Rail Corridors */}
              <path
                d="M 90 460 Q 320 310, 510 240 T 820 95"
                fill="none"
                stroke="rgba(56, 189, 248, 0.35)"
                strokeWidth="4"
                strokeDasharray="10 6"
              />
              <path
                d="M 160 120 Q 410 250, 690 420"
                fill="none"
                stroke="rgba(168, 85, 247, 0.35)"
                strokeWidth="3"
                strokeDasharray="6 6"
              />

              {/* Morning Peak Transit Isochrone Contours */}
              {showIsochrones && (
                <g>
                  <ellipse
                    cx="440"
                    cy="265"
                    rx="290"
                    ry="175"
                    transform="rotate(-18 440 265)"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.22)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <ellipse
                    cx="440"
                    cy="265"
                    rx="200"
                    ry="120"
                    transform="rotate(-18 440 265)"
                    fill="url(#iso-15)"
                    stroke="rgba(16, 185, 129, 0.45)"
                    strokeWidth="1.5"
                  />
                  <ellipse
                    cx="440"
                    cy="265"
                    rx="115"
                    ry="70"
                    transform="rotate(-18 440 265)"
                    fill="rgba(16, 185, 129, 0.14)"
                    stroke="rgba(52, 211, 153, 0.75)"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Interactive Deck.gl Parcel Polygons & 3D Massing Extrusions */}
              {parcels.map((parcel, idx) => {
                const positions = [
                  { x: 240, y: 310 },
                  { x: 325, y: 245 },
                  { x: 465, y: 335 },
                  { x: 545, y: 390 },
                  { x: 650, y: 165 },
                  { x: 735, y: 255 },
                ];
                const pos = positions[idx % positions.length];
                const isSelected = parcel.id === selectedParcel.id;
                const fillHex =
                  parcel.todStatus === "DIRECT_TOD_BONUS"
                    ? "rgba(16, 185, 129, 0.55)"
                    : parcel.todStatus === "STANDARD_INFILL"
                      ? "rgba(245, 158, 11, 0.55)"
                      : "rgba(244, 63, 94, 0.55)";
                const strokeHex =
                  parcel.todStatus === "DIRECT_TOD_BONUS"
                    ? "#34d399"
                    : parcel.todStatus === "STANDARD_INFILL"
                      ? "#fbbf24"
                      : "#fb7185";
                const roofOffset = photorealistic3dEnabled
                  ? Math.round((parcel.maxHeightFeet + (parcel.todStatus === "DIRECT_TOD_BONUS" ? 30 : 0)) * 0.28)
                  : 0;

                return (
                  <g
                    key={parcel.id}
                    className="cursor-pointer transition-transform"
                    onClick={() => onSelectParcel(parcel)}
                  >
                    {/* Base Parcel Footprint */}
                    <polygon
                      points={`${pos.x - 36},${pos.y - 22} ${pos.x + 36},${pos.y - 22} ${pos.x + 44},${pos.y + 22} ${pos.x - 28},${pos.y + 22}`}
                      fill={fillHex}
                      stroke={isSelected ? "#ffffff" : strokeHex}
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* 3D Photorealistic Massing Extrusion when 3D mode is active */}
                    {photorealistic3dEnabled && (
                      <g>
                        <polygon
                          points={`${pos.x - 28},${pos.y + 22} ${pos.x + 44},${pos.y + 22} ${pos.x + 44},${pos.y + 22 - roofOffset} ${pos.x - 28},${pos.y + 22 - roofOffset}`}
                          fill={fillHex}
                          stroke={strokeHex}
                          strokeWidth="1.5"
                        />
                        <polygon
                          points={`${pos.x - 36},${pos.y - 22 - roofOffset} ${pos.x + 36},${pos.y - 22 - roofOffset} ${pos.x + 44},${pos.y + 22 - roofOffset} ${pos.x - 28},${pos.y + 22 - roofOffset}`}
                          fill={strokeHex}
                          fillOpacity="0.85"
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 2.5 : 1}
                        />
                      </g>
                    )}

                    <text
                      x={pos.x + 4}
                      y={pos.y - roofOffset - 28}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {parcel.address.split(",")[0]}
                    </text>
                    <text
                      x={pos.x + 4}
                      y={pos.y - roofOffset - 14}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9.5"
                    >
                      {parcel.countyName} • FAR {parcel.baseAllowableFar}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Parcel Selector Overlay Strip */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 max-w-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 backdrop-blur space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Click Parcel to Run ADK
                  </span>
                  <Badge variant="default">
                    {photorealistic3dEnabled ? "3D Tiles Massing" : "2D Deck.gl GeoJSON"}
                  </Badge>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {parcels.map((p) => {
                    const active = p.id === selectedParcel.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectParcel(p)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition-all ${
                          active
                            ? "border-emerald-500 bg-emerald-950/40 text-white"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span className="truncate">{p.address.split(",")[0]}</span>
                          <span
                            className={`ml-2 h-2 w-2 rounded-full shrink-0 ${
                              p.todStatus === "DIRECT_TOD_BONUS"
                                ? "bg-emerald-400"
                                : p.todStatus === "STANDARD_INFILL"
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                            }`}
                          />
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{p.countyName}</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Train className="h-2.5 w-2.5" />
                            {p.distanceToTransitMiles} mi
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

