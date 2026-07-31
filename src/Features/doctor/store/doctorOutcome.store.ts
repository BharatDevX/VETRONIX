import { create } from "zustand";

import { DoctorMeetingOutcome } from "../types/doctorOutcome.types";

interface State {
  outcomes: DoctorMeetingOutcome[];
  loading: boolean;
  saving: boolean;
  setOutcomes: (data: DoctorMeetingOutcome[]) => void;
  upsertOutcome: (data: DoctorMeetingOutcome) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
}

export const useDoctorOutcomeStore = create<State>((set) => ({
  outcomes: [],
  loading: false,
  saving: false,
  setOutcomes: (data) => set({ outcomes: data }),
  upsertOutcome: (data) =>
    set((state) => {
      const index = state.outcomes.findIndex((item) => item.id === data.id);

      if (index >= 0) {
        const next = [...state.outcomes];
        next[index] = data;
        return { outcomes: next };
      }

      return { outcomes: [...state.outcomes, data] };
    }),
  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
}));