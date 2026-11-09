"use client";

import type { ParcelRecord } from "@sitestack/ts-types";
import React, { useCallback } from "react";
import { useSiteStackStore } from "@/lib/store";
import { useAdkFeasibilityStream } from "@/lib/use-adk-stream";
import { FeasibilitySidebar } from "./components/feasibility-sidebar";
import { GeospatialCanvas } from "./components/geospatial-canvas";

export default function ExploreGeospatialPage() {
  const {
    parcels,
    selectedParcel,
    photorealistic3dEnabled,
    showIsochrones,
    proFormaParams,
    activeFeasibilityRun,
    streamingSteps,
    isStreaming,
    selectParcel,
    setPhotorealistic3dEnabled,
    setShowIsochrones,
  } = useSiteStackStore();

  const { triggerFeasibilityRun } = useAdkFeasibilityStream();

  const handleSelectParcel = useCallback(
    (parcel: ParcelRecord) => {
      selectParcel(parcel.id);
      void triggerFeasibilityRun(parcel, proFormaParams);
    },
    [proFormaParams, selectParcel, triggerFeasibilityRun]
  );

  const handleManualReRun = useCallback(() => {
    void triggerFeasibilityRun(selectedParcel, proFormaParams);
  }, [proFormaParams, selectedParcel, triggerFeasibilityRun]);

  return (
    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
      <GeospatialCanvas
        parcels={parcels}
        selectedParcel={selectedParcel}
        photorealistic3dEnabled={photorealistic3dEnabled}
        showIsochrones={showIsochrones}
        onSelectParcel={handleSelectParcel}
        onToggle3d={setPhotorealistic3dEnabled}
        onToggleIsochrones={setShowIsochrones}
      />
      <FeasibilitySidebar
        parcel={selectedParcel}
        feasibilityRun={activeFeasibilityRun}
        streamingSteps={streamingSteps}
        isStreaming={isStreaming}
        onRunFeasibility={handleManualReRun}
      />
    </div>
  );
}

