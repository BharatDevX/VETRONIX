import { create } from "zustand";
import { SecondarySaleReport } from "../types/secondarySales.types";

interface State {

    reports: SecondarySaleReport[];

    loading: boolean;

    setReports: (reports: SecondarySaleReport[]) => void;

    setLoading: (loading: boolean) => void;

}

export const useSecondarySalesStore = create<State>((set)=>({

    reports: [],

    loading: false,

    setReports:(reports)=>set({reports}),

    setLoading:(loading)=>set({loading})

}));