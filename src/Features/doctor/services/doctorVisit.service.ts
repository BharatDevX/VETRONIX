import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";

import { DoctorVisitForm } from "../types/doctoVisit.types";
import { getLocalActivities, getLocalPartyById, isLocalPartyId, saveLocalActivity } from "../../../services/local/localParty.service";

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

export async function getDoctorVisits(employeeId: string) {
  const { data, error } = await supabase
    .from("doctor_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .order("visit_date", {
      ascending: false,
    });

  if (error) throw error;

  const local = await getLocalActivities(employeeId, "doctor", "visit");
  return [...(data ?? []), ...local];
}

export async function getCurrentMonthDoctorVisits(employeeId: string) {
  const start = dayjs().startOf("month").format("YYYY-MM-DD");
  const end = dayjs().endOf("month").format("YYYY-MM-DD");
  const { data, error } = await supabase
    .from("doctor_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("visit_date", start)
    .lte("visit_date", end)
    .order("visit_date", { ascending: false })
    .order("visit_time", { ascending: false });
  if (error) throw error;
  const visits = data ?? [];
  if (!visits.length) return [];
  const ids = visits.map((v: any) => v.id);
  const { data: products, error: productError } = await supabase
    .from("doctor_visit_products")
    .select("visit_id, product_id")
    .in("visit_id", ids);
  if (productError) throw productError;
  const map = new Map<string, string[]>();
  (products ?? []).forEach((row: any) => {
    const list = map.get(row.visit_id) ?? [];
    list.push(row.product_id);
    map.set(row.visit_id, list);
  });
  const remoteVisits = visits.map((visit: any) => ({ ...visit, product_ids: map.get(visit.id) ?? [] }));
  const local = await getLocalActivities(employeeId, "doctor", "visit");
  const localStart = dayjs().startOf("month").toISOString();
  const localThisMonth = local.filter((visit) => visit.created_at >= localStart);
  return [...remoteVisits, ...localThisMonth];
}

export async function saveDoctorVisit(employeeId: string, form: DoctorVisitForm) {
  if (isLocalPartyId(form.doctor_id)) {
    const party = await getLocalPartyById(employeeId, "doctor", form.doctor_id);
    if (!party) throw new Error("This local doctor is no longer available on this device.");
    const data = await saveLocalActivity(employeeId, "doctor", "visit", {
      doctor_id: form.doctor_id,
      visit_date: form.visit_date,
      visit_time: form.visit_time,
      location: form.location,
      vehicle_type: form.vehicle_type,
      discussion: form.discussion,
      outcome: form.outcome,
      remarks: form.remarks,
      next_followup_date: form.next_followup_date,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      product_ids: form.product_ids ?? [],
    }, party.name);
    return { data, isUpdate: false, isLocal: true };
  }

  const { data: existing, error: existingError } = await supabase
    .from("doctor_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("doctor_id", form.doctor_id)
    .eq("visit_date", form.visit_date)
    .eq("visit_time", form.visit_time)
    .maybeSingle();

  if (existingError) throw existingError;

  const payload = {
    employee_id: employeeId,
    doctor_id: form.doctor_id,
    visit_date: form.visit_date,
    visit_time: form.visit_time,
    location: form.location,
    vehicle_type: form.vehicle_type,
    discussion: form.discussion,
    outcome: form.outcome,
    remarks: form.remarks,
    next_followup_date: form.next_followup_date,
    latitude: form.latitude,
    longitude: form.longitude,
  };

  let savedRecord: any;
  let isUpdate = false;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("doctor_visits")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    savedRecord = data;
    isUpdate = true;
  } else {
    const { data, error } = await supabase
      .from("doctor_visits")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    savedRecord = data;
  }

  await replaceProductMappings(
    "doctor_visit_products",
    "visit_id",
    savedRecord.id,
    form.product_ids
  );

  return { data: savedRecord, isUpdate };
}