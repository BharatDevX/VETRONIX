import dayjs from "dayjs";

import { supabase } from "../../../services/supabase/supabase";
import { DealerMeetingOutcomeForm } from "../types/dealerOutcome.types";

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("duplicate") || message.includes("already exists") || message.includes("unique")) {
    return new Error("This dealer outcome already exists. It was not duplicated.");
  }

  if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
    return new Error("Network issue. Please check your connection and try again.");
  }

  if (message.includes("validation") || message.includes("required")) {
    return new Error("Please complete the required fields before saving.");
  }

  return new Error("Unable to save the dealer outcome right now.");
}

export async function getDealerOutcomes(employeeId: string) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();

  const { data, error } = await supabase
    .from("dealer_meeting_outcomes")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .order("meeting_date");

  if (error) throw toFriendlyError(error);

  return data;
}

export async function saveDealerOutcome(employeeId: string, form: DealerMeetingOutcomeForm) {
  const month = dayjs().month() + 1;
  const year = dayjs().year();

  const { data: existing, error: existingError } = await supabase
    .from("dealer_meeting_outcomes")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("dealer_id", form.dealer_id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (existingError) throw toFriendlyError(existingError);

  const payload = {
    employee_id: employeeId,
    dealer_id: form.dealer_id,
    location: form.location,
    meeting_date: form.meeting_date,
    outcome: form.outcome,
    month,
    year,
  };

  let savedRecord: any;
  let isUpdate = false;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("dealer_meeting_outcomes")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw toFriendlyError(error);

    savedRecord = data;
    isUpdate = true;
  } else {
    const { data, error } = await supabase
      .from("dealer_meeting_outcomes")
      .insert(payload)
      .select()
      .single();

    if (error) throw toFriendlyError(error);

    savedRecord = data;
  }

  return { data: savedRecord, isUpdate };
}