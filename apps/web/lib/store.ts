import type {
  AgentReasoningStep,
  FeasibilityRunSummary,
  ParcelRecord,
  ProFormaParameters,
  StakeholderLead,
  StakeholderRole,
} from "@sitestack/ts-types";
import { create } from "zustand";
import {
  MARYLAND_SEED_LEADS,
  MARYLAND_SEED_PARCELS,
  buildFeasibilityRunSummary,
} from "./proforma-engine";

interface SiteStackState {
  parcels: ParcelRecord[];
  selectedParcel: ParcelRecord;
  photorealistic3dEnabled: boolean;
  showIsochrones: boolean;
  activeRole: StakeholderRole;
  proFormaParams: ProFormaParameters;
  activeFeasibilityRun: FeasibilityRunSummary;
  streamingSteps: AgentReasoningStep[];
  isStreaming: boolean;
  leads: StakeholderLead[];
  selectParcel: (parcelId: string) => void;
  setPhotorealistic3dEnabled: (enabled: boolean) => void;
  setShowIsochrones: (show: boolean) => void;
  setActiveRole: (role: StakeholderRole) => void;
  updateProFormaParams: (partial: Partial<ProFormaParameters>) => void;
  setStreamingState: (isStreaming: boolean, steps?: AgentReasoningStep[]) => void;
  appendStreamingStep: (step: AgentReasoningStep) => void;
  setFeasibilityResult: (summary: FeasibilityRunSummary) => void;
  addStakeholderLead: (lead: Omit<StakeholderLead, "id" | "createdAt">) => void;
}

const DEFAULT_PARAMS: ProFormaParameters = {
  targetAmiMixPct: 40,
  weightedAmiTier: 60,
  constructionType: "TYPE_V_WOOD",
  parkingRatioPerUnit: 0.25,
  useTodBonus: true,
  pilotAbatementEnabled: true,
};

const initialParcel = MARYLAND_SEED_PARCELS[0];
const initialRun = buildFeasibilityRunSummary(initialParcel, DEFAULT_PARAMS);

export const useSiteStackStore = create<SiteStackState>((set, get) => ({
  parcels: MARYLAND_SEED_PARCELS,
  selectedParcel: initialParcel,
  photorealistic3dEnabled: false,
  showIsochrones: true,
  activeRole: "DEVELOPER",
  proFormaParams: DEFAULT_PARAMS,
  activeFeasibilityRun: initialRun,
  streamingSteps: initialRun.steps,
  isStreaming: false,
  leads: MARYLAND_SEED_LEADS,

  selectParcel: (parcelId: string) => {
    const found =
      get().parcels.find((p) => p.id === parcelId || p.accountId === parcelId) ??
      get().parcels[0];
    const params = get().proFormaParams;
    const summary = buildFeasibilityRunSummary(found, params);
    set({
      selectedParcel: found,
      activeFeasibilityRun: summary,
      streamingSteps: summary.steps,
    });
  },

  setPhotorealistic3dEnabled: (enabled: boolean) =>
    set({ photorealistic3dEnabled: enabled }),

  setShowIsochrones: (show: boolean) => set({ showIsochrones: show }),

  setActiveRole: (role: StakeholderRole) => set({ activeRole: role }),

  updateProFormaParams: (partial: Partial<ProFormaParameters>) => {
    const nextParams = { ...get().proFormaParams, ...partial };
    const summary = buildFeasibilityRunSummary(get().selectedParcel, nextParams);
    set({
      proFormaParams: nextParams,
      activeFeasibilityRun: summary,
    });
  },

  setStreamingState: (isStreaming: boolean, steps?: AgentReasoningStep[]) =>
    set((state) => ({
      isStreaming,
      streamingSteps: steps ?? state.streamingSteps,
    })),

  appendStreamingStep: (step: AgentReasoningStep) =>
    set((state) => ({
      streamingSteps: [...state.streamingSteps, step],
    })),

  setFeasibilityResult: (summary: FeasibilityRunSummary) =>
    set({
      activeFeasibilityRun: summary,
      isStreaming: false,
    }),

  addStakeholderLead: (leadInput) =>
    set((state) => ({
      leads: [
        {
          ...leadInput,
          id: `lead-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...state.leads,
      ],
    })),
}));

