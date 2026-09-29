import { supabase } from "../../../services/supabase/supabase";

export interface OrderFormLine {
  id: string;
  productId: string | null;
  productName: string;
  packSize: string;
  boxCount: number;
  quantity: number;
  rate: number;
  amount: number;
}

export interface EmployeeOrderForm {
  orderNumber: string;
  saleDate: string;
  saleType: "dealer" | "retailer" | "farmer";
  hq: string;
  dealerName: string;
  retailerName: string;
  farmerName: string;
  totalAmount: number;
  lines: OrderFormLine[];
  createdAt: string;
}

export async function getEmployeeOrderForms(employeeId: string): Promise<EmployeeOrderForm[]> {
  if (!employeeId?.trim()) return [];

  const [salesResult, dealersResult, retailersResult, productsResult] = await Promise.all([
    supabase
      .from("sales")
      .select("id, order_number, sale_date, sale_type, hq, dealer_id, retailer_id, farmer_name, product_id, pack_size, box_count, quantity, rate, amount, created_at")
      .eq("employee_id", employeeId)
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("dealers").select("id, dealer_name"),
    supabase.from("retailers").select("id, retailer_name"),
    supabase.from("products").select("id, product_name"),
  ]);

  if (salesResult.error) throw salesResult.error;
  if (dealersResult.error) throw dealersResult.error;
  if (retailersResult.error) throw retailersResult.error;
  if (productsResult.error) throw productsResult.error;

  const dealerMap = new Map<string, string>(
    (dealersResult.data ?? []).map((row: any) => [String(row.id), String(row.dealer_name ?? "")]),
  );
  const retailerMap = new Map<string, string>(
    (retailersResult.data ?? []).map((row: any) => [String(row.id), String(row.retailer_name ?? "")]),
  );
  const productMap = new Map<string, string>(
    (productsResult.data ?? []).map((row: any) => [String(row.id), String(row.product_name ?? "")]),
  );

  const grouped = new Map<string, EmployeeOrderForm>();

  for (const row of salesResult.data ?? []) {
    const orderNumber = String(row.order_number ?? row.id ?? "").trim();
    if (!orderNumber) continue;

    let order = grouped.get(orderNumber);
    if (!order) {
      order = {
        orderNumber,
        saleDate: String(row.sale_date ?? ""),
        saleType: row.sale_type as EmployeeOrderForm["saleType"],
        hq: String(row.hq ?? ""),
        dealerName: row.dealer_id ? dealerMap.get(String(row.dealer_id)) ?? "" : "",
        retailerName: row.retailer_id ? retailerMap.get(String(row.retailer_id)) ?? "" : "",
        farmerName: String(row.farmer_name ?? ""),
        totalAmount: 0,
        lines: [],
        createdAt: String(row.created_at ?? ""),
      };
      grouped.set(orderNumber, order);
    }

    const amount = Number(row.amount ?? Number(row.quantity ?? 0) * Number(row.rate ?? 0));
    order.lines.push({
      id: String(row.id),
      productId: row.product_id ? String(row.product_id) : null,
      productName: row.product_id ? productMap.get(String(row.product_id)) ?? "Unknown Product" : "Unknown Product",
      packSize: String(row.pack_size ?? ""),
      boxCount: Number(row.box_count ?? 0),
      quantity: Number(row.quantity ?? 0),
      rate: Number(row.rate ?? 0),
      amount,
    });
    order.totalAmount += Number.isFinite(amount) ? amount : 0;
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const dateCompare = b.saleDate.localeCompare(a.saleDate);
    if (dateCompare !== 0) return dateCompare;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
