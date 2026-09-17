export type SaleType = "dealer" | "retailer" | "farmer";

export interface Sale {
  id: string;
  employee_id: string;
  doctor_id: string | null;
  dealer_id: string | null;
  retailer_id: string | null;
  farmer_name: string | null;
  order_number: string | null;
  hq: string | null;
  pack_size: string | null;
  box_count: number | null;
  invoice_no: string | null;
  credit_period: number | null;
  due_date: string | null;

  // Kept for backward compatibility with existing reports/admin.
  // This stores the first selected medicine.
  product_id: string | null;

  sale_date: string;
  quantity: number;
  rate: number;
  amount: number | null;
  sale_type: SaleType;
  created_at: string;
}

export interface SaleForm {
  order_number: string;
  hq: string;
  dealer_id?: string;
  retailer_id?: string;
  farmer_name?: string;

  // New multi-medicine field
  product_ids: string[];
  lines: Array<{
    product_id: string;
    pack_size: string;
    box_count: number;
    product_name?: string;
    quantity: number;
    rate: number;
  }>;

  sale_date: string;
  quantity: number;
  rate: number;
  sale_type: SaleType;
}