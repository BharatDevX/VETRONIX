import { supabase } from "../../../services/supabase/supabase";
import { DoctorWiseSaleReport } from "../types/doctorWiseSales.types";

interface ParentRow { id: string; doctor_id: string; dealer_id: string; retailer_id: string | null; sale_date: string; }
interface LineRow { id: string; parent_id: string; product_id: string; pack_size: string | null; quantity: number | null; rate: number | null; amount: number | null; }

export async function getDoctorWiseSales(employeeId: string): Promise<DoctorWiseSaleReport[]> {
  if (!employeeId) return [];

  const { data: parents, error: parentError } = await supabase
    .from("doctor_wise_sales")
    .select("id, doctor_id, dealer_id, retailer_id, sale_date")
    .eq("employee_id", employeeId)
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (parentError) throw parentError;

  const parentRows = (parents ?? []) as ParentRow[];
  if (!parentRows.length) return [];

  const parentIds = parentRows.map((row) => row.id);
  const doctorIds = [...new Set(parentRows.map((row) => row.doctor_id))];
  const dealerIds = [...new Set(parentRows.map((row) => row.dealer_id))];
  const retailerIds = [...new Set(parentRows.map((row) => row.retailer_id).filter((id): id is string => Boolean(id)))];

  const [{ data: lines, error: lineError }, { data: doctors, error: doctorError }, { data: dealers, error: dealerError }, { data: retailers, error: retailerError }] = await Promise.all([
    supabase.from("doctor_wise_sale_products").select("id, parent_id, product_id, pack_size, quantity, rate, amount").in("parent_id", parentIds),
    supabase.from("doctors").select("id, doctor_name").in("id", doctorIds),
    supabase.from("dealers").select("id, dealer_name").in("id", dealerIds),
    retailerIds.length ? supabase.from("retailers").select("id, retailer_name").in("id", retailerIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (lineError) throw lineError;
  if (doctorError) throw doctorError;
  if (dealerError) throw dealerError;
  if (retailerError) throw retailerError;

  const productIds = [...new Set(((lines ?? []) as LineRow[]).map((row) => row.product_id))];
  const { data: products, error: productError } = productIds.length
    ? await supabase.from("products").select("id, product_name").in("id", productIds)
    : { data: [], error: null };
  if (productError) throw productError;

  const doctorMap = new Map<string, string>((doctors ?? []).map((row: any) => [row.id, row.doctor_name ?? ""]));
  const dealerMap = new Map<string, string>((dealers ?? []).map((row: any) => [row.id, row.dealer_name ?? ""]));
  const retailerMap = new Map<string, string>((retailers ?? []).map((row: any) => [row.id, row.retailer_name ?? ""]));
  const productMap = new Map<string, string>((products ?? []).map((row: any) => [row.id, row.product_name ?? ""]));
  const parentMap = new Map(parentRows.map((row) => [row.id, row]));

  return ((lines ?? []) as LineRow[]).map((line) => {
    const parent = parentMap.get(line.parent_id);
    return {
      id: line.id,
      doctor_name: parent ? doctorMap.get(parent.doctor_id) ?? "" : "",
      dealer_name: parent ? dealerMap.get(parent.dealer_id) ?? "" : "",
      retailer_name: parent?.retailer_id ? retailerMap.get(parent.retailer_id) ?? "" : "",
      product_name: productMap.get(line.product_id) ?? "",
      pack_size: line.pack_size ?? "",
      quantity: Number(line.quantity ?? 0),
      rate: Number(line.rate ?? 0),
      amount: Number(line.amount ?? 0),
      sale_date: parent?.sale_date ?? "",
    };
  });
}
