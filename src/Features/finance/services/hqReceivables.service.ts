import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";

export interface HqReceivableSummary {
  hq: string;
  month: number;
  year: number;
  paidAmount: number;
  overdueAmount: number;
}

function isMissingTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code?: string }).code) === "42P01"
  );
}

export async function getMyHqReceivableSummary(employeeId: string): Promise<HqReceivableSummary> {
  const today = dayjs();
  const month = today.month() + 1;
  const year = today.year();

  if (!employeeId) {
    return { hq: "", month, year, paidAmount: 0, overdueAmount: 0 };
  }

  // HQ receivables are explicitly assigned to an employee by Admin.
  // Do not infer the HQ from sales: an Admin can create/edit an HQ receivable
  // before the employee has any sale for that HQ. The previous implementation
  // could therefore query the wrong HQ and return zero even when a row existed.
  const { data: rows, error } = await supabase
    .from("hq_receivables")
    .select("hq, month, year, paid_amount, overdue_amount, updated_at")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error && isMissingTable(error)) {
    return { hq: "", month, year, paidAmount: 0, overdueAmount: 0 };
  }
  if (error) throw error;

  const receivables = (rows ?? []) as Array<{
    hq?: string | null;
    month?: number;
    year?: number;
    paid_amount?: number | string | null;
    overdue_amount?: number | string | null;
    updated_at?: string | null;
  }>;

  if (receivables.length === 0) {
    return { hq: "", month, year, paidAmount: 0, overdueAmount: 0 };
  }

  // An employee can have multiple HQs. The dashboard card is a summary, so
  // show the combined current-month amounts while listing the HQ names.
  const hqNames = Array.from(
    new Set(
      receivables
        .map((row) => String(row.hq ?? "").trim())
        .filter(Boolean),
    ),
  );

  return {
    hq: hqNames.length > 1 ? hqNames.join(" • ") : hqNames[0] ?? "",
    month,
    year,
    paidAmount: receivables.reduce((sum, row) => sum + Number(row.paid_amount ?? 0), 0),
    overdueAmount: receivables.reduce((sum, row) => sum + Number(row.overdue_amount ?? 0), 0),
  };
}
