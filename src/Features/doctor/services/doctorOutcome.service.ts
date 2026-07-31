import dayjs from "dayjs";

import { supabase } from "../../../services/supabase/supabase";

import { DoctorMeetingOutcomeForm } from "../types/doctorOutcome.types";

async function replaceProductMappings(
  table: string,
  foreignKey: string,
  recordId: string,
  productIds: string[]
) {
  const uniqueProductIds = Array.from(
    new Set((productIds ?? []).filter(Boolean))
  );

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq(foreignKey, recordId);

  if (deleteError) throw deleteError;

  if (uniqueProductIds.length === 0) return;

  const rows = uniqueProductIds.map((product_id) => ({
    [foreignKey]: recordId,
    product_id,
  }));

  const { error: insertError } = await supabase.from(table).insert(rows);

  if (insertError) throw insertError;
}

export async function getDoctorOutcomes(employeeId: string) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();

  const { data, error } = await supabase
    .from("doctor_meeting_outcomes")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .order("created_at");

  if (error) throw error;

  return data;
}

export async function saveDoctorOutcome(employeeId: string, form: DoctorMeetingOutcomeForm) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();

  const { data: existing, error: existingError } = await supabase
    .from("doctor_meeting_outcomes")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("doctor_id", form.doctor_id)
    .eq("month", month)
    .eq("year", year)
    .eq("area", form.area)
    .maybeSingle();

  if (existingError) throw existingError;

  const payload = {
    employee_id: employeeId,
    doctor_id: form.doctor_id,
    area: form.area,
    agreed_percentage: form.agreed_percentage,
    month,
    year,
  };

  let savedRecord: any;
  let isUpdate = false;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("doctor_meeting_outcomes")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    savedRecord = data;
    isUpdate = true;
  } else {
    const { data, error } = await supabase
      .from("doctor_meeting_outcomes")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    savedRecord = data;
  }

  await replaceProductMappings(
    "doctor_meeting_outcome_products",
    "outcome_id",
    savedRecord.id,
    form.product_ids
  );

  return { data: savedRecord, isUpdate };
}