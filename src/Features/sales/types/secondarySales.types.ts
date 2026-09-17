export interface SecondarySaleForm {
  dealer_id: string;
  sale_date: string;
  lines: import("./fieldSales.types").SaleLineItem[];
}

export interface SecondarySaleReport {
  id: string;
  dealer_name: string;
  product_name: string;
  pack_size: string;
  quantity: number;
  rate: number;
  amount: number;
  sale_date: string;
}
