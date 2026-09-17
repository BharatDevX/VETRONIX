export interface FarmerVisit {
  id: string;
  employee_id: string;
  farmer_name: string;
  visit_date: string;
  visit_time: string;
  location: string;
  vehicle_type: string;
  discussion: string;
  outcome: string;
  product_ids: string[];
  next_followup_date: string;
  created_at: string;
  updated_at: string;
}

export interface FarmerVisitForm {
  farmer_name: string;
  visit_date: string;
  visit_time: string;
  location: string;
  vehicle_type: string;
  discussion: string;
  outcome: string;
  product_ids: string[];
  next_followup_date: string;
  farmer_is_local?: boolean;
}
