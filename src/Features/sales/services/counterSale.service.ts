import { supabase } from "../../../services/supabase/supabase";
import { CounterSaleReport } from "../types/counterSale.types";

interface ParentRow { id: string; sale_date: string; }
interface LineRow { id: string; parent_id: string; product_id: string; pack_size: string | null; quantity: number | null; rate: number | null; amount: number | null; }
interface NameRow { id: string; dealer_name?: string | null; product_name?: string | null; }

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) return String((error as { message?: string }).message ?? "");
  return "";
}

function friendly(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) return new Error("Network issue. Please check your connection and try again.");
  console.error("getCounterSales Supabase error:", error);
  return new Error("Unable to load the counter sales report right now.");
}

export async function getCounterSales(employeeId: string): Promise<CounterSaleReport[]> {
  if (!employeeId) return [];
  try {
    const { data: parents, error: parentError } = await supabase.from("counter_sales").select("id, sale_date, dealer_id").eq("employee_id", employeeId).order("sale_date", { ascending: false }).order("created_at", { ascending: false });
    if (parentError) throw parentError;
    const parentRows = (parents ?? []) as Array<ParentRow & { dealer_id: string }>;
    if (!parentRows.length) return [];

    const parentIds = parentRows.map((row) => row.id);
    const dealerIds = [...new Set(parentRows.map((row) => row.dealer_id))];
    const [{ data: lines, error: lineError }, { data: dealers, error: dealerError }] = await Promise.all([
      supabase.from("counter_sale_products").select("id, parent_id, product_id, pack_size, quantity, rate, amount").in("parent_id", parentIds),
      supabase.from("dealers").select("id, dealer_name").in("id", dealerIds),
    ]);
    if (lineError) throw lineError;
    if (dealerError) throw dealerError;

    const productIds = [...new Set(((lines ?? []) as LineRow[]).map((row) => row.product_id))];
    const { data: products, error: productError } = productIds.length ? await supabase.from("products").select("id, product_name").in("id", productIds) : { data: [], error: null };
    if (productError) throw productError;

    const dealerMap = new Map<string, string>((dealers as NameRow[] ?? []).map((row) => [row.id, row.dealer_name ?? ""]));
    const productMap = new Map<string, string>((products as NameRow[] ?? []).map((row) => [row.id, row.product_name ?? ""]));
    const dateMap = new Map(parentRows.map((row) => [row.id, row.sale_date]));
    const dealerMapByParent = new Map(parentRows.map((row) => [row.id, dealerMap.get(row.dealer_id) ?? ""]));

    return ((lines ?? []) as LineRow[]).map((line) => ({
      id: line.id,
      dealer_name: dealerMapByParent.get(line.parent_id) ?? "",
      product_name: productMap.get(line.product_id) ?? "",
      pack_size: line.pack_size ?? "",
      quantity: Number(line.quantity ?? 0),
      rate: Number(line.rate ?? 0),
      amount: Number(line.amount ?? 0),
      sale_date: dateMap.get(line.parent_id) ?? "",
    }));
  } catch (error) {
    throw friendly(error);
  }
}
