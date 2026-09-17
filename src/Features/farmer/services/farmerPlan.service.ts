import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";
import { FarmerMeetingPlanForm } from "../types/farmerPlan.types";
import { getLocalActivities, getLocalPartyById, saveLocalActivity } from "../../../services/local/localParty.service";

export async function getFarmerPlans(employeeId: string) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();
  const { data, error } = await supabase
    .from("farmer_meeting_plans")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .order("planned_date");
  if (error) throw error;
  const local = await getLocalActivities(employeeId, "farmer", "meeting_plan");
  return [...(data ?? []), ...local];
}

export async function createFarmerPlan(employeeId: string, form: FarmerMeetingPlanForm) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();

  if (form.farmer_is_local) {
    const party = await getLocalPartyById(employeeId, "farmer", form.farmer_name);
    if (!party) throw new Error("This local farmer is no longer available on this device.");
    const data = await saveLocalActivity(employeeId, "farmer", "meeting_plan", {
      farmer_name: party.name,
      location: form.location.trim(),
      planned_date: form.planned_date,
      note: form.note.trim() || null,
      month,
      year,
      is_submitted: true,
    }, party.name);
    return { data, isUpdate: false, isLocal: true };
  }

  const { data: existing, error: existingError } = await supabase
    .from("farmer_meeting_plans")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("farmer_name", form.farmer_name.trim())
    .eq("planned_date", form.planned_date)
    .maybeSingle();

  if (existingError) throw existingError;

  const payload = {
    employee_id: employeeId,
    farmer_name: form.farmer_name.trim(),
    location: form.location.trim(),
    planned_date: form.planned_date,
    note: form.note.trim() || null,
    month,
    year,
    is_submitted: true,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("farmer_meeting_plans")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return { data, isUpdate: true };
  }

  const { data, error } = await supabase
    .from("farmer_meeting_plans")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return { data, isUpdate: false };
}
