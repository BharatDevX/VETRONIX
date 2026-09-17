import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";
import { FarmerVisitForm } from "../types/farmerVisit.types";
import { getLocalActivities, getLocalPartyById, isLocalPartyId, saveLocalActivity } from "../../../services/local/localParty.service";

async function replaceProductMappings(recordId: string, productIds: string[]) {
  const ids = Array.from(new Set((productIds ?? []).filter(Boolean)));
  const { error: deleteError } = await supabase
    .from("farmer_visit_products")
    .delete()
    .eq("visit_id", recordId);
  if (deleteError) throw deleteError;
  if (!ids.length) return;
  const { error: insertError } = await supabase
    .from("farmer_visit_products")
    .insert(ids.map((product_id) => ({ visit_id: recordId, product_id })));
  if (insertError) throw insertError;
}

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("duplicate") || message.includes("already exists") || message.includes("unique")) {
    return new Error("This farmer visit already exists. It was not duplicated.");
  }
  if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
    return new Error("Network issue. Please check your connection and try again.");
  }
  return new Error("Unable to save the farmer visit right now.");
}

export async function getFarmerVisits(employeeId: string) {
  const { data, error } = await supabase
    .from("farmer_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .order("visit_date", { ascending: false });
  if (error) throw toFriendlyError(error);
  const local = await getLocalActivities(employeeId, "farmer", "visit");
  return [...(data ?? []), ...local];
}

export async function getCurrentMonthFarmerVisits(employeeId: string) {
  const start = dayjs().startOf("month").format("YYYY-MM-DD");
  const end = dayjs().endOf("month").format("YYYY-MM-DD");
  const { data, error } = await supabase
    .from("farmer_visits")
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
    .from("farmer_visit_products")
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
  const local = await getLocalActivities(employeeId, "farmer", "visit");
  const localStart = dayjs().startOf("month").toISOString();
  return [...remoteVisits, ...local.filter((visit) => visit.created_at >= localStart)];
}

export async function saveFarmerVisit(employeeId: string, form: FarmerVisitForm) {
  if (form.farmer_is_local) {
    const localId = form.farmer_name;
    const party = await getLocalPartyById(employeeId, "farmer", localId);
    if (!party) throw new Error("This local farmer is no longer available on this device.");
    const data = await saveLocalActivity(employeeId, "farmer", "visit", {
      farmer_name: party.name,
      visit_date: form.visit_date,
      visit_time: form.visit_time,
      location: form.location.trim(),
      vehicle_type: form.vehicle_type,
      discussion: form.discussion.trim(),
      outcome: form.outcome.trim(),
      next_followup_date: form.next_followup_date,
      product_ids: form.product_ids ?? [],
    }, party.name);
    return { data, isUpdate: false, isLocal: true };
  }

  const normalizedName = form.farmer_name.trim();
  const { data: existing, error: existingError } = await supabase
    .from("farmer_visits")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("farmer_name", normalizedName)
    .eq("visit_date", form.visit_date)
    .eq("visit_time", form.visit_time)
    .maybeSingle();

  if (existingError) throw toFriendlyError(existingError);

  const payload = {
    employee_id: employeeId,
    farmer_name: normalizedName,
    visit_date: form.visit_date,
    visit_time: form.visit_time,
    location: form.location.trim(),
    vehicle_type: form.vehicle_type,
    discussion: form.discussion.trim(),
    outcome: form.outcome.trim(),
    next_followup_date: form.next_followup_date,
  };

  if (existing?.id) {
    const { data, error } = await supabase.from("farmer_visits").update(payload).eq("id", existing.id).select().single();
    if (error) throw toFriendlyError(error);
    await replaceProductMappings(data.id, form.product_ids);
    return { data, isUpdate: true };
  }

  const { data, error } = await supabase.from("farmer_visits").insert(payload).select().single();
  if (error) throw toFriendlyError(error);
  await replaceProductMappings(data.id, form.product_ids);
  return { data, isUpdate: false };
}
