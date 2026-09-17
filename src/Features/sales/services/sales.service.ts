import { supabase } from "../../../services/supabase/supabase";
import { getLocalPartyById, isLocalPartyId } from "../../../services/local/localParty.service";
import { Sale, SaleForm, SaleType } from "../types/sales.types";

interface SalePayload {
  employee_id: string;
  doctor_id: string | null;
  retailer_id: string | null;
  dealer_id: string;
  farmer_name: string | null;
  product_id: string;
  product_ids: string[];
  sale_date: string;
  order_number: string;
  hq: string;
  pack_size: string;
  box_count: number;
  invoice_no: string | null;
  credit_period: number | null;
  due_date: string | null;
  quantity: number;
  rate: number;
  sale_type: SaleType;
}

interface SaveSaleResult {
  data: Sale;
  isUpdate: boolean;
}

interface ErrorLike {
  code?: string;
  message?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as ErrorLike).message ?? "");
  }

  return "";
}

function getErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as ErrorLike).code ?? "");
  }

  return "";
}

function isDuplicateError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);

  return code === "23505" || message.includes("duplicate") || message.includes("already exists") || message.includes("unique");
}

function normalizeRequiredId(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeRetailerId(saleType: SaleType, retailerId?: string): string | null {
  if (saleType !== "retailer") {
    return null;
  }

  const trimmedRetailerId = retailerId?.trim();
  return trimmedRetailerId ? trimmedRetailerId : null;
}

async function replaceSaleProductMappings(saleId: string, productIds: string[]) {
  const uniqueProductIds = Array.from(new Set((productIds ?? []).filter(Boolean)));

  const { error: deleteError } = await supabase
    .from("sale_products")
    .delete()
    .eq("sale_id", saleId);

  if (deleteError) throw deleteError;
  if (uniqueProductIds.length === 0) return;

  const rows = uniqueProductIds.map((product_id) => ({
    sale_id: saleId,
    product_id,
  }));

  const { error: insertError } = await supabase
    .from("sale_products")
    .insert(rows);

  if (insertError) throw insertError;
}

async function findExistingSale(payload: SalePayload): Promise<Sale | null> {
  const baseQuery = supabase
    .from("sales")
    .select("*")
    .eq("employee_id", payload.employee_id)
    .eq("sale_type", payload.sale_type)
    .eq("dealer_id", payload.dealer_id)
    .eq("product_id", payload.product_id)
    .eq("sale_date", payload.sale_date)
    .eq("order_number", payload.order_number)
    .order("created_at", { ascending: false })
    .limit(1);

  const doctorQuery = payload.doctor_id
    ? baseQuery.eq("doctor_id", payload.doctor_id)
    : baseQuery.is("doctor_id", null);

  const retailerQuery = payload.retailer_id
    ? doctorQuery.eq("retailer_id", payload.retailer_id)
    : doctorQuery.is("retailer_id", null);

  const farmerQuery = payload.farmer_name
    ? retailerQuery.eq("farmer_name", payload.farmer_name)
    : retailerQuery.is("farmer_name", null);

  const invoiceQuery = payload.invoice_no
    ? farmerQuery.eq("invoice_no", payload.invoice_no)
    : farmerQuery.is("invoice_no", null);

  const { data, error } = await invoiceQuery.maybeSingle();

  if (error) {
    console.log("findExistingSale:", error);
    throw error;
  }

  return (data ?? null) as Sale | null;
}

async function updateExistingSale(existingId: string, payload: SalePayload): Promise<Sale> {
  const { data, error } = await supabase
    .from("sales")
    .update({
      employee_id: payload.employee_id,
      doctor_id: payload.doctor_id,
      retailer_id: payload.retailer_id,
      dealer_id: payload.dealer_id,
      farmer_name: payload.farmer_name,
      product_id: payload.product_id,
      sale_date: payload.sale_date,
      order_number: payload.order_number,
      hq: payload.hq,
      pack_size: payload.pack_size,
      box_count: payload.box_count,
      quantity: payload.quantity,
      rate: payload.rate,
      sale_type: payload.sale_type,
      invoice_no: payload.invoice_no,
      credit_period: payload.credit_period,
      due_date: payload.due_date,
    })
    .eq("id", existingId)
    .select()
    .single();

  if (error) {
  console.log("updateExistingSale:", error);
  throw error;
}
  if (!data) throw new Error("Unable to save the order form right now.");

  return data as Sale;
}

export async function getNextOrderNumber(employeeCode: string): Promise<string> {
  const normalized = employeeCode.trim();
  if (!normalized) throw new Error("Employee ID is missing.");

  const { data, error } = await supabase.rpc("get_next_order_number", {
    p_employee_id: normalized,
  });

  if (!error && data) return String(data);

  // Compatibility fallback for databases where the migration/RPC has not yet been applied.
  const { data: employeeRow, error: employeeError } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_id", normalized)
    .maybeSingle();
  if (employeeError) throw error ?? employeeError;
  if (!employeeRow?.id) throw new Error("Employee profile not found.");

  const { data: rows, error: fallbackError } = await supabase
    .from("sales")
    .select("order_number")
    .eq("employee_id", employeeRow.id)
    .like("order_number", `${normalized}-%`);

  if (fallbackError) throw error ?? fallbackError;

  let max = 0;
  for (const row of rows ?? []) {
    const match = String((row as { order_number?: string | null }).order_number ?? "").match(/-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }

  return `${normalized}-${String(max + 1).padStart(3, "0")}`;
}

export async function getSales(employeeId: string) {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("employee_id", employeeId)
    .order("sale_date", {
      ascending: false,
    });

 if (error) {
  console.log("getSales:", error);
  throw error;
}

  return (data ?? []) as Sale[];
}

export async function getTodaySalesTotal(employeeId: string): Promise<number> {
  if (!employeeId) {
    return 0;
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("sales")
    .select("amount")
    .eq("employee_id", employeeId)
    .eq("sale_date", today);

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{ amount: number | null }>).reduce(
    (total, row) => total + Number(row.amount ?? 0),
    0
  );
}


export async function getMonthlySalesSummary(employeeId: string): Promise<{ achieved: number; target: number }> {
  if (!employeeId) return { achieved: 0, target: 0 };

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10);

  const [{ data: salesRows, error: salesError }, { data: targetRow, error: targetError }] = await Promise.all([
    supabase
      .from("actual_sales")
      .select("total_amount")
      .eq("employee_id", employeeId)
      .gte("sale_date", monthStart)
      .lte("sale_date", monthEnd),
    supabase
      .from("sales_targets")
      .select("target_amount")
      .eq("employee_id", employeeId)
      .eq("month", month)
      .eq("year", year)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (salesError) throw salesError;
  if (targetError) throw targetError;

  const achieved = ((salesRows ?? []) as Array<{ total_amount: number | null }>).reduce(
    (total, row) => total + Number(row.total_amount ?? 0),
    0,
  );

  return {
    achieved,
    target: Number((targetRow as { target_amount?: number | null } | null)?.target_amount ?? 0),
  };
}

async function resolveFarmerName(employeeId: string, value?: string): Promise<string | null> {
  const normalized = value?.trim() ?? "";
  if (!normalized) return null;

  // A farmer created by the employee is stored locally in AsyncStorage.
  // Never send the local-party:* identifier to Supabase; resolve it to the
  // actual farmer name first.
  if (!isLocalPartyId(normalized)) return normalized;

  const party = await getLocalPartyById(employeeId, "farmer", normalized);
  if (!party?.name) {
    throw new Error("The selected farmer could not be found on this device. Please select or add the farmer again.");
  }

  return party.name;
}

export async function saveSale(employeeId: string, form: SaleForm): Promise<SaveSaleResult> {
  const dealerId = normalizeRequiredId(form.dealer_id);
  const lines = (form.lines ?? []).filter((line) => line.product_id?.trim());
  const productIds = Array.from(new Set(lines.map((line) => line.product_id.trim())));
  const saleDate = form.sale_date?.trim();
  const orderNumber = form.order_number?.trim();
  const hq = form.hq?.trim();
  const retailerId = normalizeRetailerId(form.sale_type, form.retailer_id);

  if (!employeeId?.trim()) {
    throw new Error("Unable to save the order form right now.");
  }

  if (!dealerId) {
    throw new Error("Please select a dealer before saving.");
  }

  if (lines.length === 0) {
    throw new Error("Please select at least one medicine.");
  }

  if (form.sale_type === "retailer" && !retailerId) {
    throw new Error("Please select a retailer for retailer sales.");
  }

  if (!saleDate) {
    throw new Error("Please select a sale date before saving.");
  }

  if (!orderNumber) {
    throw new Error("Please enter the order number before saving.");
  }

  if (!hq) {
    throw new Error("Please enter the head quarter before saving.");
  }

  let firstSavedRecord: Sale | null = null;
  let anyUpdated = false;

  for (const line of lines) {
    const quantity = Number(line.quantity);
    const rate = Number(line.rate);
    if (!line.pack_size?.trim()) {
      throw new Error("Please select a pack size for every medicine.");
    }
    if (!Number.isFinite(Number(line.box_count)) || Number(line.box_count) <= 0) {
      throw new Error("Please select the number of boxes for every medicine.");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity must be greater than 0 for every medicine.");
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Rate must be greater than 0 for every medicine.");
    }

    const creditPeriodRaw = null;

    const payload: SalePayload = {
      employee_id: employeeId,
      doctor_id: null,
      retailer_id: retailerId,
      dealer_id: dealerId,
      farmer_name: await resolveFarmerName(employeeId, form.farmer_name),
      product_id: line.product_id.trim(),
      product_ids: [line.product_id.trim()],
      sale_date: saleDate,
      order_number: orderNumber,
      hq,
      pack_size: line.pack_size.trim(),
      box_count: Number(line.box_count || 0),
      invoice_no: null,
      credit_period: creditPeriodRaw,
      due_date: null,
      quantity,
      rate,
      sale_type: form.sale_type,
    };

    const existing = await findExistingSale(payload);
    let savedRecord: Sale;
    let isUpdate = false;

    if (existing?.id) {
      savedRecord = await updateExistingSale(existing.id, payload);
      isUpdate = true;
    } else {
      const { data, error } = await supabase.from("sales").insert({
        employee_id: payload.employee_id,
        doctor_id: payload.doctor_id,
        retailer_id: payload.retailer_id,
        dealer_id: payload.dealer_id,
        farmer_name: payload.farmer_name,
        product_id: payload.product_id,
        sale_date: payload.sale_date,
        order_number: payload.order_number,
        hq: payload.hq,
        pack_size: payload.pack_size,
        box_count: payload.box_count,
        quantity: payload.quantity,
        rate: payload.rate,
        sale_type: payload.sale_type,
        invoice_no: payload.invoice_no,
        credit_period: payload.credit_period,
        due_date: payload.due_date,
      }).select().single();

      if (error) {
        if (!isDuplicateError(error)) throw error;
        const parallelSale = await findExistingSale(payload);
        if (!parallelSale?.id) throw error;
        savedRecord = await updateExistingSale(parallelSale.id, payload);
        isUpdate = true;
      } else {
        if (!data) throw new Error("Unable to save the order form right now.");
        savedRecord = data as Sale;
      }
    }

    await replaceSaleProductMappings(savedRecord.id, payload.product_ids);
    firstSavedRecord ??= savedRecord;
    anyUpdated ||= isUpdate;
  }

  if (!firstSavedRecord) throw new Error("Unable to save the order form right now.");
  return { data: firstSavedRecord, isUpdate: anyUpdated };
}
