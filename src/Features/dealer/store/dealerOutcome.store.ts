import { create } from "zustand";

import { DealerMeetingOutcome } from "../types/dealerOutcome.types";

interface State {
  outcomes: DealerMeetingOutcome[];
  loading: boolean;
  saving: boolean;
  setOutcomes: (outcomes: DealerMeetingOutcome[]) => void;
  upsertOutcome: (outcome: DealerMeetingOutcome) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
}

export const useDealerOutcomeStore = create<State>((set) => ({
  outcomes: [],
  loading: false,
  saving: false,
  setOutcomes: (outcomes) => set({ outcomes }),
  upsertOutcome: (outcome) =>
    set((state) => {
      const index = state.outcomes.findIndex((item) => item.id === outcome.id);

      if (index >= 0) {
        const next = [...state.outcomes];
        next[index] = outcome;
        return { outcomes: next };
      }

      return { outcomes: [...state.outcomes, outcome] };
    }),
  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
}));