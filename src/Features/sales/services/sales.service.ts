import { supabase } from "../../../services/supabase/supabase";
import { Sale, SaleForm, SaleType } from "../types/sales.types";

interface SalePayload {
  employee_id: string;
  doctor_id: string | null;
  retailer_id: string | null;
  dealer_id: string;
  product_id: string;
  sale_date: string;
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

function normalizeDoctorId(saleType: SaleType, doctorId?: string): string | null {
  if (saleType !== "doctor") {
    return null;
  }

  const trimmedDoctorId = doctorId?.trim();
  return trimmedDoctorId ? trimmedDoctorId : null;
}

function normalizeRetailerId(saleType: SaleType, retailerId?: string): string | null {
  if (saleType !== "doctor" && saleType !== "retailer") {
    return null;
  }

  const trimmedRetailerId = retailerId?.trim();
  return trimmedRetailerId ? trimmedRetailerId : null;
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
    .order("created_at", { ascending: false })
    .limit(1);

  const doctorQuery = payload.doctor_id
    ? baseQuery.eq("doctor_id", payload.doctor_id)
    : baseQuery.is("doctor_id", null);

  const { data, error } = payload.retailer_id
    ? await doctorQuery.eq("retailer_id", payload.retailer_id).maybeSingle()
    : await doctorQuery.is("retailer_id", null).maybeSingle();

  if (error) {
    console.log("findExistingSale:", error);
    throw error;
  }

  return (data ?? null) as Sale | null;
}

async function updateExistingSale(existingId: string, payload: SalePayload): Promise<Sale> {
  const { data, error } = await supabase
    .from("sales")
    .update(payload)
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

export async function saveSale(employeeId: string, form: SaleForm): Promise<SaveSaleResult> {
  const quantity = Number(form.quantity);
  const rate = Number(form.rate);
  const dealerId = normalizeRequiredId(form.dealer_id);
  const productId = normalizeRequiredId(form.product_id);
  const saleDate = form.sale_date?.trim();
  const doctorId = normalizeDoctorId(form.sale_type, form.doctor_id);
  const retailerId = normalizeRetailerId(form.sale_type, form.retailer_id);

  if (!employeeId?.trim()) {
    throw new Error("Unable to save the order form right now.");
  }

  if (!dealerId) {
    throw new Error("Please select a dealer before saving.");
  }

  if (!productId) {
    throw new Error("Please select a medicine before saving.");
  }

  if (form.sale_type === "doctor" && !doctorId) {
    throw new Error("Please select a doctor for doctor sales.");
  }

  if (form.sale_type === "retailer" && !retailerId) {
    throw new Error("Please select a retailer for retailer sales.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Rate must be greater than 0.");
  }

  if (!saleDate) {
    throw new Error("Please select a sale date before saving.");
  }

  const payload: SalePayload = {
    employee_id: employeeId,
    doctor_id: doctorId,
    retailer_id: retailerId,
    dealer_id: dealerId,
    product_id: productId,
    sale_date: saleDate,
    quantity,
    rate,
    sale_type: form.sale_type,
  };

  const existing = await findExistingSale(payload);

  if (existing?.id) {
    const updatedSale = await updateExistingSale(existing.id, payload);
    return { data: updatedSale, isUpdate: true };
  }

  const { data, error } = await supabase
    .from("sales")
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      const saleCreatedByParallelRequest = await findExistingSale(payload);

      if (saleCreatedByParallelRequest?.id) {
        const updatedSale = await updateExistingSale(saleCreatedByParallelRequest.id, payload);
        return { data: updatedSale, isUpdate: true };
      }
    }

    console.log("INSERT ERROR:", error);
throw error;
  }

  if (!data) {
    throw new Error("Unable to save the order form right now.");
  }

  return { data: data as Sale, isUpdate: false };
}
