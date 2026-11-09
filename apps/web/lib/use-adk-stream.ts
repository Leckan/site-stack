"use client";

import type {
  AgentReasoningStep,
  FeasibilityRunSummary,
  ParcelRecord,
  ProFormaParameters,
} from "@sitestack/ts-types";
import { useCallback, useRef } from "react";
import { buildFeasibilityRunSummary } from "./proforma-engine";
import { useSiteStackStore } from "./store";

export function useAdkFeasibilityStream() {
  const abortRef = useRef<AbortController | null>(null);
  const {
    setStreamingState,
    appendStreamingStep,
    setFeasibilityResult,
  } = useSiteStackStore();

  const triggerFeasibilityRun = useCallback(
    async (parcel: ParcelRecord, params: ProFormaParameters) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setStreamingState(true, []);

      try {
        const response = await fetch("/api/feasibility/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parcel, params }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Stream status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const lines = chunk.split("\n");
            let eventType = "message";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataStr += line.slice(5).trim();
              }
            }

            if (!dataStr) continue;
            const parsed = JSON.parse(dataStr);

            if (eventType === "agent_step") {
              appendStreamingStep(parsed as AgentReasoningStep);
            } else if (eventType === "feasibility_result") {
              setFeasibilityResult(parsed as FeasibilityRunSummary);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const fallback = buildFeasibilityRunSummary(parcel, params);
        setStreamingState(false, fallback.steps);
        setFeasibilityResult(fallback);
      }
    },
    [appendStreamingStep, setFeasibilityResult, setStreamingState]
  );

  return { triggerFeasibilityRun };
}

