import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";
import {
  Attendance,
  MarkAttendancePayload,
} from "../types/attendance.types";

export async function getTodayAttendance(
  employeeId: string
): Promise<Attendance | null> {
  const today = dayjs().format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("attendance_date", today)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function markAttendance(
  payload: MarkAttendancePayload
): Promise<Attendance> {
  const today = dayjs().format("YYYY-MM-DD");

  const now = dayjs().toISOString();

  const { data, error } = await supabase
    .from("attendance")
    .insert({
      employee_id: payload.employee_id,
      attendance_date: today,
      check_in_time: now,
      latitude: payload.latitude,
      longitude: payload.longitude,
      address: payload.address ?? null,
      status: payload.status,
      remarks: payload.remarks ?? null,
      working_minutes: 0,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}