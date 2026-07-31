export type MTPStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected";

export type HQExTour =
  | "HQ"
  | "EX"
  | "TOUR";

export interface MonthlyTourProgramme {
  id: string;
  employee_id: string;

  month: number;
  year: number;

  designation: string | null;
  hq: string | null;

  status: MTPStatus;

  submitted_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface MonthlyTourEntry {
  id: string;

  programme_id: string;

  tour_date: string;

  hq_ex_tour: HQExTour;

  route_plan_details: string;

  total_km: number;

  travel_mode: string | null;

  total_customer_plan: number;

  route_no: string | null;

  sequence_no: number;

  created_at: string;
  updated_at: string;
}

export interface MonthlyTourProgrammeWithEntries
  extends MonthlyTourProgramme {
  entries: MonthlyTourEntry[];
}

export interface MonthlyTourSummary {
  plannedDays: number;
  totalTours: number;
  totalKm: number;
  totalCustomers: number;
}