export interface DoctorMeetingOutcome {
  id: string;

  employee_id: string;

  doctor_id: string;

  area: string;

  agreed_percentage: number;

  month: number;

  year: number;

  created_at: string;
}

export interface DoctorMeetingOutcomeProduct {
  id: string;

  outcome_id: string;

  product_id: string;
}

export interface DoctorMeetingOutcomeForm {
  doctor_id: string;

  area: string;

  agreed_percentage: number;

  product_ids: string[];
}