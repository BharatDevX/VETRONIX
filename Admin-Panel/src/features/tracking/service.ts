import { getEmployeesByIds, type WorkSessionRow } from "@/features/shared/real-db";
import { supabase } from "@/services/supabase";
import type { TrackingRecord } from "@/types/domain";
import { todayIsoDate } from "@/lib/format";

export async function getLiveLocations() {
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("work_date", todayIsoDate())
    .order("start_time", { ascending: false });

  if (error) {
    throw error;
  }

  const sessions = (data ?? []) as WorkSessionRow[];
  const employees = await getEmployeesByIds(sessions.map((session) => session.employee_id));

  return sessions
    .map((session): TrackingRecord | null => {
      const latitude = session.end_latitude ?? session.start_latitude;
      const longitude = session.end_longitude ?? session.start_longitude;

      if (latitude === null || longitude === null) {
        return null;
      }

      const employee = employees.get(session.employee_id);

      return {
        battery_percent: null,
        employee_id: session.employee_id,
        employee_name: employee?.full_name ?? "Unknown employee",
        id: session.id,
        latitude,
        longitude,
        today_km: Number(session.total_km ?? 0),
        updated_at: session.end_time ?? session.start_time ?? session.work_date,
      };
    })
    .filter((location): location is TrackingRecord => location !== null);
}
