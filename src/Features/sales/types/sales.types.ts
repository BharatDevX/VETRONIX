export type SaleType = "counter" | "doctor";

export interface Sale {
  id: string;
  employee_id: string;
  doctor_id: string | null;
  dealer_id: string;
  product_id: string;
  sale_date: string;
  quantity: number;
  rate: number;
  amount: number;
  sale_type: SaleType;
  created_at?: string;
}

export interface SaleForm {
  doctor_id?: string;
  dealer_id: string;
  product_id: string;
  sale_date: string;
  quantity: number;
  rate: number;
  sale_type: SaleType;
}