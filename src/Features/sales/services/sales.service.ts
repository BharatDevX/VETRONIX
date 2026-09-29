import { supabase } from "../../../services/supabase/supabase";
import { getLocalPartyById, isLocalPartyId } from "../../../services/local/localParty.service";
import { Sale, SaleForm, SaleType } from "../types/sales.types";

interface SalePayload {
  employee_id: string;
  doctor_id: string | null;
  retailer_id: string | null;
  dealer_id: string | null;
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
  const dealerId = form.dealer_id?.trim() || null;
  const lines = (form.lines ?? []).filter((line) => line.product_id?.trim());
  const saleDate = form.sale_date?.trim();
  const orderNumber = form.order_number?.trim();
  const hq = form.hq?.trim();
  const retailerId = normalizeRetailerId(form.sale_type, form.retailer_id);

  if (!employeeId?.trim()) {
    throw new Error("Unable to save the order form right now.");
  }

  if (form.sale_type !== "farmer" && !dealerId) {
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

  /*
   * IMPORTANT:
   * An order is the document, while every medicine row is a separate sale
   * line. Therefore product_id MUST NOT be used to decide whether a line is
   * an update. The same product is allowed to appear more than once in the
   * same order.
   *
   * We first determine whether THIS ORDER already exists. If it is a new
   * order, every form line is inserted independently. If it is an existing
   * order, its existing rows are updated by position and additional rows are
   * inserted. This preserves duplicate medicines such as A, B, A.
   */
  const { data: existingOrderRows, error: existingOrderError } = await supabase
    .from("sales")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("sale_type", form.sale_type)
    .eq("order_number", orderNumber)
    .eq("sale_date", saleDate)
    .order("created_at", { ascending: true });

  if (existingOrderError) {
    console.log("findExistingOrder:", existingOrderError);
    throw existingOrderError;
  }

  // If an order number is reused, it is an edit/update of that order.
  // Otherwise this is a completely new order and ALL lines are inserted.
  const existingRows = (existingOrderRows ?? []) as Sale[];
  const isExistingOrder = existingRows.length > 0;

  let firstSavedRecord: Sale | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
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
      credit_period: null,
      due_date: null,
      quantity,
      rate,
      sale_type: form.sale_type,
    };

    let savedRecord: Sale;

    if (isExistingOrder && existingRows[index]?.id) {
      // Existing order: update the line at the same position.
      // We intentionally DO NOT search by product_id here, because the same
      // medicine may occur multiple times in one order.
      savedRecord = await updateExistingSale(existingRows[index].id, payload);
    } else {
      // New line, including duplicate products in a brand-new order.
      const { data, error } = await supabase
        .from("sales")
        .insert({
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
        .select()
        .single();

      if (error) {
        console.log("insertSaleLine:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Unable to save the order form right now.");
      }

      savedRecord = data as Sale;
    }

    await replaceSaleProductMappings(savedRecord.id, payload.product_ids);
    firstSavedRecord ??= savedRecord;
  }

  /*
   * If an existing order was edited and the new form contains fewer lines,
   * remove only the surplus old lines. This keeps History/PDF synchronized
   * with exactly what the employee currently has on the form.
   */
  if (isExistingOrder && existingRows.length > lines.length) {
    const surplusRows = existingRows.slice(lines.length);
    const surplusIds = surplusRows.map((row) => row.id).filter(Boolean);

    if (surplusIds.length > 0) {
      const { error: mappingDeleteError } = await supabase
        .from("sale_products")
        .delete()
        .in("sale_id", surplusIds);

      if (mappingDeleteError) {
        console.log("delete surplus sale mappings:", mappingDeleteError);
        throw mappingDeleteError;
      }

      const { error: surplusDeleteError } = await supabase
        .from("sales")
        .delete()
        .in("id", surplusIds);

      if (surplusDeleteError) {
        console.log("delete surplus sale lines:", surplusDeleteError);
        throw surplusDeleteError;
      }
    }
  }

  if (!firstSavedRecord) {
    throw new Error("Unable to save the order form right now.");
  }

  return {
    data: firstSavedRecord,
    isUpdate: isExistingOrder,
  };
}
