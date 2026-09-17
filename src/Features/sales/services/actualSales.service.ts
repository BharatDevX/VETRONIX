import { supabase } from "../../../services/supabase/supabase";

export interface ActualSalesReportRow {
  id: string;
  sale_id: string;
  sale_date: string;
  invoice_no: string | null;
  credit_period: number | null;
  due_date: string | null;
  hq: string | null;
  dealer_name: string;
  product_name: string;
  pack_size: string;
  box_count: number;
  quantity: number;
  rate: number;
  amount: number;
}

export async function getEmployeeActualSales(employeeId: string): Promise<ActualSalesReportRow[]> {
  if (!employeeId) return [];

  const { data: sales, error: salesError } = await supabase
    .from("actual_sales")
    .select("id, sale_date, invoice_no, credit_period, due_date, hq, dealer_id")
    .eq("employee_id", employeeId)
    .order("sale_date", { ascending: false });
  if (salesError) throw salesError;
  if (!sales?.length) return [];

  const saleIds = sales.map((sale) => sale.id);
  const dealerIds = [...new Set(sales.map((sale) => sale.dealer_id).filter(Boolean))];

  const [{ data: lines, error: linesError }, { data: dealers, error: dealerError }] = await Promise.all([
    supabase
      .from("actual_sale_products")
      .select("id, parent_id, product_id, pack_size, box_count, quantity, rate, amount")
      .in("parent_id", saleIds),
    dealerIds.length
      ? supabase.from("dealers").select("id, dealer_name").in("id", dealerIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);
  if (linesError) throw linesError;
  if (dealerError) throw dealerError;

  const productIds = [...new Set((lines ?? []).map((line) => line.product_id).filter(Boolean))];
  const { data: products, error: productsError } = productIds.length
    ? await supabase.from("products").select("id, product_name").in("id", productIds)
    : { data: [], error: null };
  if (productsError) throw productsError;

  const saleMap = new Map(sales.map((sale) => [sale.id, sale]));
  const dealerMap = new Map((dealers ?? []).map((dealer: any) => [dealer.id, dealer.dealer_name ?? ""]));
  const productMap = new Map((products ?? []).map((product: any) => [product.id, product.product_name ?? ""]));

  return (lines ?? []).map((line: any) => {
    const sale = saleMap.get(line.parent_id);
    return {
      id: line.id,
      sale_id: line.parent_id,
      sale_date: sale?.sale_date ?? "",
      invoice_no: sale?.invoice_no ?? null,
      credit_period: sale?.credit_period == null ? null : Number(sale.credit_period),
      due_date: sale?.due_date ?? null,
      hq: sale?.hq ?? null,
      dealer_name: dealerMap.get(sale?.dealer_id) ?? "",
      product_name: productMap.get(line.product_id) ?? "",
      pack_size: String(line.pack_size ?? ""),
      box_count: Number(line.box_count ?? 0),
      quantity: Number(line.quantity ?? 0),
      rate: Number(line.rate ?? 0),
      amount: Number(line.amount ?? 0),
    };
  });
}
