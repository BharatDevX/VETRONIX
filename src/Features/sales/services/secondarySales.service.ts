import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";
import type { SecondarySaleForm, SecondarySaleReport } from "../types/secondarySales.types";
import type { SaleLineItem } from "../types/fieldSales.types";

function validLines(lines: SaleLineItem[]) {
  return lines.filter((line) => line.product_id.trim());
}

function total(lines: SaleLineItem[]) {
  return validLines(lines).reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.rate || 0),
    0,
  );
}

function linePayload(line: SaleLineItem, parentId: string) {
  return {
    parent_id: parentId,
    pack_size: line.pack_size.trim(),
    product_id: line.product_id,
    quantity: Number(line.quantity),
    rate: Number(line.rate),
    amount: Number(line.quantity) * Number(line.rate),
  };
}

export function isSecondarySalesDay(date = dayjs()): boolean {
  // dayjs: Sunday=0 ... Saturday=6.
  return date.day() === 6;
}

/**
 * Returns the Saturday that owns the current weekly submission window.
 * Saturday is the first day of the window; Sunday-Friday are catch-up days.
 */
export function getSecondarySalesWeekDate(date = dayjs()): string {
  const daysSinceSaturday = (date.day() + 1) % 7;
  return date.subtract(daysSinceSaturday, "day").format("YYYY-MM-DD");
}


export async function markMissedSecondarySalesDaysAbsent(
  employeeId: string,
  weekStart: dayjs.Dayjs,
  throughDate: dayjs.Dayjs,
) {
  if (throughDate.isBefore(weekStart, "day")) return;

  const startDate = weekStart.format("YYYY-MM-DD");
  const endDate = throughDate.format("YYYY-MM-DD");

  const { data: existingRows, error: existingError } = await supabase
    .from("attendance")
    .select("attendance_date")
    .eq("employee_id", employeeId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (existingError) throw existingError;

  const existingDates = new Set(
    (existingRows ?? []).map((row: { attendance_date: string }) => row.attendance_date),
  );

  const missingRows: Array<Record<string, unknown>> = [];
  let cursor = weekStart;

  while (!cursor.isAfter(throughDate, "day")) {
    const date = cursor.format("YYYY-MM-DD");
    if (!existingDates.has(date)) {
      missingRows.push({
        employee_id: employeeId,
        attendance_date: date,
        check_in_time: `${date}T00:00:00`,
        check_out_time: null,
        latitude: 0,
        longitude: 0,
        address: "Automatic absence due to late Secondary Sales submission",
        status: "ABSENT",
        remarks: "Weekly Secondary Sales was submitted after the scheduled Saturday.",
        working_minutes: 0,
      });
    }
    cursor = cursor.add(1, "day");
  }

  if (missingRows.length) {
    const { error: insertError } = await supabase
      .from("attendance")
      .insert(missingRows);

    if (insertError) throw insertError;
  }
}

export async function saveSecondarySale(
  employeeId: string,
  form: SecondarySaleForm,
) {
  if (!employeeId) throw new Error("Employee session is missing.");

  const today = dayjs();
  const weekDate = getSecondarySalesWeekDate(today);

  if (!form.dealer_id) throw new Error("Please select a dealer.");

  // If the employee submits after Saturday, finalize every missed day from
  // that week's Saturday through yesterday as ABSENT. The submission itself
  // is not an absence and today's attendance remains available after submit.
  const weekStart = dayjs(weekDate);
  await markMissedSecondarySalesDaysAbsent(
    employeeId,
    weekStart,
    today.subtract(1, "day"),
  );
  if (!validLines(form.lines).length) {
    throw new Error("Please select at least one medicine.");
  }

  if (!validLines(form.lines).every(
    (line) => Number(line.quantity) > 0 && Number(line.rate) > 0,
  )) {
    throw new Error("Please enter quantity and rate for every selected medicine.");
  }

  // One submission per employee per weekly Saturday window.

  const { data: existing, error: existingError } = await supabase
    .from("secondary_sales")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("week_date", weekDate)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    throw new Error("You have already submitted Secondary Sales for this Saturday.");
  }

  const { data, error } = await supabase
    .from("secondary_sales")
    .insert({
      employee_id: employeeId,
      dealer_id: form.dealer_id,
      sale_date: today.format("YYYY-MM-DD"),
      week_date: weekDate,
      total_amount: total(form.lines),
    })
    .select("*")
    .single();

  if (error) throw error;

  try {
    const rows = validLines(form.lines).map((line) =>
      linePayload(line, data.id),
    );

    const { error: lineError } = await supabase
      .from("secondary_sale_products")
      .insert(rows);

    if (lineError) throw lineError;
  } catch (error) {
    await supabase.from("secondary_sales").delete().eq("id", data.id);
    throw error;
  }

  return data;
}

export async function hasSubmittedSecondarySales(
  employeeId: string,
  date = dayjs(),
): Promise<boolean> {
  if (!employeeId) return false;

  const weekDate = getSecondarySalesWeekDate(date);

  const { data, error } = await supabase
    .from("secondary_sales")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("week_date", weekDate)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getSecondarySales(
  employeeId: string,
  saleDate?: string,
): Promise<SecondarySaleReport[]> {
  if (!employeeId) return [];

  let query = supabase
    .from("secondary_sales")
    .select("id, sale_date, dealer_id")
    .eq("employee_id", employeeId)
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (saleDate?.trim()) {
    query = query.eq("sale_date", saleDate.trim());
  }

  const { data: parents, error: parentError } = await query;
  if (parentError) throw parentError;

  const parentRows = (parents ?? []) as Array<{
    id: string;
    sale_date: string;
    dealer_id: string;
  }>;

  if (!parentRows.length) return [];

  const parentIds = parentRows.map((row) => row.id);
  const dealerIds = [...new Set(parentRows.map((row) => row.dealer_id))];

  const [{ data: lines, error: lineError }, { data: dealers, error: dealerError }] =
    await Promise.all([
      supabase
        .from("secondary_sale_products")
        .select("id, parent_id, product_id, pack_size, quantity, rate, amount")
        .in("parent_id", parentIds),
      supabase
        .from("dealers")
        .select("id, dealer_name")
        .in("id", dealerIds),
    ]);

  if (lineError) throw lineError;
  if (dealerError) throw dealerError;

  const productIds = [
    ...new Set(
      ((lines ?? []) as Array<{ product_id: string }>).map(
        (row) => row.product_id,
      ),
    ),
  ];

  const { data: products, error: productError } = productIds.length
    ? await supabase
        .from("products")
        .select("id, product_name")
        .in("id", productIds)
    : { data: [], error: null };

  if (productError) throw productError;

  const dealerMap = new Map<string, string>(
    (dealers ?? []).map((row: any) => [row.id, row.dealer_name ?? ""]),
  );
  const productMap = new Map<string, string>(
    (products ?? []).map((row: any) => [row.id, row.product_name ?? ""]),
  );
  const dateMap = new Map(parentRows.map((row) => [row.id, row.sale_date]));
  const dealerMapByParent = new Map(
    parentRows.map((row) => [row.id, dealerMap.get(row.dealer_id) ?? ""]),
  );

  return ((lines ?? []) as Array<{
  id: string;
  parent_id: string;
  product_id: string;
  pack_size: string | null;
  quantity: number | null;
  rate: number | null;
  amount: number | null;
}>).map((line) => ({
  id: line.id,
  dealer_name: dealerMapByParent.get(line.parent_id) ?? "",
  product_name: productMap.get(line.product_id) ?? "",
  pack_size: line.pack_size ?? "",

  // Keep the original fields
  quantity: Number(line.quantity ?? 0),
  rate: Number(line.rate ?? 0),
  amount: Number(line.amount ?? 0),

  // Fields expected by the report screen
  total_quantity: Number(line.quantity ?? 0),
  total_amount: Number(line.amount ?? 0),

  sale_date: dateMap.get(line.parent_id) ?? "",
}));
}
