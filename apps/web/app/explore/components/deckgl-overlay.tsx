// Source: Google Maps Platform Code Assist (adapted for SiteStack Maryland Parcel GeoJsonLayer)
"use client";

import type { LayersList } from "@deck.gl/core";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";

export type DeckGlOverlayProps = {
  layers?: LayersList;
};

/**
 * Renders Deck.gl spatial layers (GeoJsonLayer for Maryland SDAT parcels & transit isochrones)
 * directly inside the @vis.gl/react-google-maps <Map> instance.
 */
export function DeckGlOverlay({ layers }: DeckGlOverlayProps) {
  const deck = useMemo(() => new GoogleMapsOverlay({ interleaved: true }), []);
  const map = useMap();

  useEffect(() => {
    if (map) {
      deck.setMap(map);
    }
    return () => {
      deck.setMap(null);
    };
  }, [deck, map]);

  useEffect(() => {
    deck.setProps({ layers: layers ?? [] });
  }, [deck, layers]);

  return null;
}

