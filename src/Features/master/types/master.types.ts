export interface Doctor {
  id: string;
  doctor_name: string;
  head_quarters?: string[] | null;
}

export interface Dealer {
  id: string;
  dealer_name: string;
}

export interface Retailer {
  id: string;
  retailer_name: string;
}

export interface Product {
  id: string;
  product_name: string;
}
