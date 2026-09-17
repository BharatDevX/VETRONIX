import { supabase } from "../../../services/supabase/supabase";
import type { CounterSaleForm, DoctorWiseSaleForm, SaleLineItem, SalesInvoiceForm } from "../types/fieldSales.types";

function validLines(lines: SaleLineItem[]) {
  return lines.filter((line) => line.product_id.trim());
}

function linePayload(line: SaleLineItem, parentId: string, includePackSize: boolean) {
  return {
    ...(includePackSize ? { pack_size: line.pack_size.trim() } : {}),
    box_count: Number(line.box_count || 0),
    parent_id: parentId,
    product_id: line.product_id,
    quantity: Number(line.quantity),
    rate: Number(line.rate),
    amount: Number(line.quantity) * Number(line.rate),
  };
}

async function insertLines(
  table: string,
  parentId: string,
  lines: SaleLineItem[],
  includePackSize: boolean,
  requireBoxCount: boolean,
) {
  const selected = validLines(lines);
  if (!selected.length) throw new Error("Please add at least one medicine.");

  const incomplete = selected.some((line) =>
    (includePackSize && !String(line.pack_size ?? "").trim()) ||
    (requireBoxCount && Number(line.box_count) <= 0) ||
    Number(line.quantity) <= 0 ||
    Number(line.rate) <= 0
  );

  if (incomplete) {
    throw new Error(
      requireBoxCount
        ? "Please complete pack size, box, quantity and rate for every medicine."
        : "Please complete pack size, quantity and rate for every medicine."
    );
  }

  const rows = selected.map((line) => linePayload(line, parentId, includePackSize));
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

function total(lines: SaleLineItem[]) {
  return validLines(lines).reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.rate || 0), 0);
}

export async function saveSalesInvoice(employeeId: string, form: SalesInvoiceForm) {
  if (!employeeId) throw new Error("Employee session is missing.");
  if (!form.dealer_id) throw new Error("Please select a dealer.");
  if (!form.hq.trim()) throw new Error("Please enter the head quarter.");
  if (!form.lines.some((line) => line.product_id)) throw new Error("Please add at least one medicine.");

  const { data, error } = await supabase.from("actual_sales").insert({
    employee_id: employeeId,
    dealer_id: form.dealer_id,
    sale_date: form.sale_date,
    hq: form.hq.trim(),
    invoice_no: form.invoice_no?.trim() || null,
    credit_period: form.credit_period ? Number(form.credit_period) : null,
    due_date: form.due_date || null,
    total_amount: total(form.lines),
  }).select("*").single();
  if (error) throw error;
  try {
    await insertLines("actual_sale_products", data.id, form.lines, true, true);
  } catch (error) {
    await supabase.from("actual_sales").delete().eq("id", data.id);
    throw error;
  }
  return data;
}

export async function saveCounterSale(employeeId: string, form: CounterSaleForm) {
  if (!employeeId) throw new Error("Employee session is missing.");
  if (!form.dealer_id) throw new Error("Please select a dealer.");
  if (!form.lines.some((line) => line.product_id)) throw new Error("Please add at least one medicine.");

  const { data, error } = await supabase.from("counter_sales").insert({
    employee_id: employeeId,
    dealer_id: form.dealer_id,
    sale_date: form.sale_date,
    total_amount: total(form.lines),
  }).select("*").single();
  if (error) throw error;
  try {
    await insertLines("counter_sale_products", data.id, form.lines, true, false);
  } catch (error) {
    await supabase.from("counter_sales").delete().eq("id", data.id);
    throw error;
  }
  return data;
}

export async function saveDoctorWiseSale(employeeId: string, form: DoctorWiseSaleForm) {
  if (!employeeId) throw new Error("Employee session is missing.");
  if (!form.doctor_id) throw new Error("Please select a doctor.");
  if (!form.dealer_id) throw new Error("Please select a dealer.");
  if (!form.lines.some((line) => line.product_id)) throw new Error("Please add at least one medicine.");

  const { data, error } = await supabase.from("doctor_wise_sales").insert({
    employee_id: employeeId,
    doctor_id: form.doctor_id,
    dealer_id: form.dealer_id,
    retailer_id: form.retailer_id || null,
    sale_date: form.sale_date,
    total_amount: total(form.lines),
  }).select("*").single();
  if (error) throw error;
  try {
    await insertLines("doctor_wise_sale_products", data.id, form.lines, true, false);
  } catch (error) {
    await supabase.from("doctor_wise_sales").delete().eq("id", data.id);
    throw error;
  }
  return data;
}

export async function getSalesInvoiceSummary(employeeId: string) {
  if (!employeeId) return { total: 0, count: 0 };
  const { data, error } = await supabase.from("actual_sales").select("total_amount").eq("employee_id", employeeId);
  if (error) throw error;
  return {
    total: (data ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0),
    count: data?.length ?? 0,
  };
}
