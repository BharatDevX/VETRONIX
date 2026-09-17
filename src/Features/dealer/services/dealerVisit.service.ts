import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";
import { DealerVisitForm } from "../types/dealerVisit.types";
import { getLocalActivities, getLocalPartyById, isLocalPartyId, saveLocalActivity } from "../../../services/local/localParty.service";

async function replaceProductMappings(recordId: string, productIds: string[]) {
  const ids = Array.from(new Set((productIds ?? []).filter(Boolean)));
  const { error: deleteError } = await supabase
    .from("dealer_visit_products")
    .delete()
    .eq("visit_id", recordId);
  if (deleteError) throw deleteError;
  if (!ids.length) return;
  const { error: insertError } = await supabase
    .from("dealer_visit_products")
    .insert(ids.map((product_id) => ({ visit_id: recordId, product_id })));
  if (insertError) throw insertError;
}

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("duplicate") || message.includes("already exists") || message.includes("unique")) {
    return new Error("This dealer visit already exists. It was not duplicated.");
  }

  if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
    return new Error("Network issue. Please check your connection and try again.");
  }

  if (message.includes("validation") || message.includes("required")) {
    return new Error("Please complete the required fields before saving.");
  }

  return new Error("Unable to save the dealer visit right now.");
}

export async function getDealerVisits(employeeId: string) {
  const { data, error } = await supabase
    .from("dealer_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .order("visit_date", { ascending: false });

  if (error) throw toFriendlyError(error);

  return data;
}

export async function getCurrentMonthDealerVisits(employeeId: string) {
  const start = dayjs().startOf("month").format("YYYY-MM-DD");
  const end = dayjs().endOf("month").format("YYYY-MM-DD");
  const { data, error } = await supabase
    .from("dealer_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("visit_date", start)
    .lte("visit_date", end)
    .order("visit_date", { ascending: false })
    .order("visit_time", { ascending: false });
  if (error) throw toFriendlyError(error);
  const visits = data ?? [];
  if (!visits.length) return [];
  const ids = visits.map((v: any) => v.id);
  const { data: products, error: productError } = await supabase
    .from("dealer_visit_products")
    .select("visit_id, product_id")
    .in("visit_id", ids);
  if (productError) throw toFriendlyError(productError);
  const map = new Map<string, string[]>();
  (products ?? []).forEach((row: any) => {
    const list = map.get(row.visit_id) ?? [];
    list.push(row.product_id);
    map.set(row.visit_id, list);
  });
  const remoteVisits = visits.map((visit: any) => ({ ...visit, product_ids: map.get(visit.id) ?? [] }));
  const local = await getLocalActivities(employeeId, "dealer", "visit");
  const localStart = dayjs().startOf("month").toISOString();
  return [...remoteVisits, ...local.filter((visit) => visit.created_at >= localStart)];
}

export async function saveDealerVisit(employeeId: string, form: DealerVisitForm) {
  if (isLocalPartyId(form.dealer_id)) {
    const party = await getLocalPartyById(employeeId, "dealer", form.dealer_id);
    if (!party) throw new Error("This local dealer is no longer available on this device.");
    const data = await saveLocalActivity(employeeId, "dealer", "visit", {
      dealer_id: form.dealer_id,
      visit_date: form.visit_date,
      visit_time: form.visit_time,
      location: form.location,
      vehicle_type: form.vehicle_type,
      discussion: form.discussion,
      outcome: form.outcome,
      product_ids: form.product_ids ?? [],
      next_followup_date: form.next_followup_date,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
    }, party.name);
    return { data, isUpdate: false, isLocal: true };
  }

  const { data: existing, error: existingError } = await supabase
    .from("dealer_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("dealer_id", form.dealer_id)
    .eq("visit_date", form.visit_date)
    .maybeSingle();

  if (existingError) throw toFriendlyError(existingError);

  const payload = {
    employee_id: employeeId,
    dealer_id: form.dealer_id,
    visit_date: form.visit_date,
    visit_time: form.visit_time,
    location: form.location,
    vehicle_type: form.vehicle_type,
    discussion: form.discussion,
    outcome: form.outcome,
    next_followup_date: form.next_followup_date,
    latitude: form.latitude,
    longitude: form.longitude,
  };

  let savedRecord: any;
  let isUpdate = false;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("dealer_visits")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw toFriendlyError(error);

    savedRecord = data;
    isUpdate = true;
  } else {
    const { data, error } = await supabase
      .from("dealer_visits")
      .insert(payload)
      .select()
      .single();

    if (error) throw toFriendlyError(error);

    savedRecord = data;
  }

  await replaceProductMappings(savedRecord.id, form.product_ids);

  return { data: savedRecord, isUpdate };
}