export interface SaleLineItem {
  id: string;
  product_id: string;
  pack_size: string;
  box_count: number;
  product_name?: string;
  quantity: number;
  rate: number;
}

export interface SalesInvoiceForm {
  dealer_id: string;
  sale_date: string;
  hq: string;
  invoice_no?: string;
  credit_period?: number | string;
  due_date?: string;
  lines: SaleLineItem[];
}

export interface CounterSaleForm {
  dealer_id: string;
  sale_date: string;
  lines: SaleLineItem[];
}

export interface DoctorWiseSaleForm {
  doctor_id: string;
  dealer_id: string;
  retailer_id: string;
  sale_date: string;
  lines: SaleLineItem[];
}
