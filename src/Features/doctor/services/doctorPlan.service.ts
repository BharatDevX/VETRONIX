import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";
import { DoctorMeetingPlanForm } from "../types/doctorPlan.types";
import { getLocalActivities, getLocalPartyById, isLocalPartyId, saveLocalActivity } from "../../../services/local/localParty.service";

export async function getPlans(employeeId: string) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();

  const { data, error } = await supabase
    .from("doctor_meeting_plans")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .order("planned_date");

  if (error) throw error;
  const local = await getLocalActivities(employeeId, "doctor", "meeting_plan");
  return [...(data ?? []), ...local];
}

export async function createPlan(employeeId: string, form: DoctorMeetingPlanForm) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();

  if (isLocalPartyId(form.doctor_id)) {
    const party = await getLocalPartyById(employeeId, "doctor", form.doctor_id);
    if (!party) throw new Error("This local doctor is no longer available on this device.");
    const data = await saveLocalActivity(employeeId, "doctor", "meeting_plan", {
      doctor_id: form.doctor_id,
      location: form.location,
      planned_date: form.planned_date,
      discussion: "",
      reply: form.reply?.trim() ? form.reply.trim() : null,
      month,
      year,
      is_submitted: true,
    }, party.name);
    return { data, isUpdate: false, isLocal: true };
  }

  const { data: existing, error: existingError } = await supabase
    .from("doctor_meeting_plans")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("doctor_id", form.doctor_id)
    .eq("planned_date", form.planned_date)
    .maybeSingle();

  if (existingError) throw existingError;

  // discussion is retained in the DB for backward compatibility, but it is
  // intentionally no longer collected in the employee UI.
  const payload = {
    employee_id: employeeId,
    doctor_id: form.doctor_id,
    location: form.location,
    planned_date: form.planned_date,
    discussion: "",
    reply: form.reply?.trim() ? form.reply.trim() : null,
    month,
    year,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("doctor_meeting_plans")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return { data, isUpdate: true };
  }

  const { data, error } = await supabase
    .from("doctor_meeting_plans")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return { data, isUpdate: false };
}
