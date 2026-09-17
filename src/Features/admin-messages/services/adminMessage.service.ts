import { supabase } from "../../../services/supabase/supabase";

export interface AdminEmployeeMessage {
  id: string;
  employee_id: string;
  title: string;
  message: string;
  message_type: "info" | "warning" | "alert" | "order";
  created_at: string;
  status: "pending" | "done";
  done_at: string | null;
}

export function subscribeToAdminMessages(
  employeeId: string,
  onMessage: (message: AdminEmployeeMessage) => void,
) {
  const channelName = `employee-admin-messages-${employeeId}-${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "employee_admin_messages",
        filter: `employee_id=eq.${employeeId}`,
      },
      (payload) => {
        onMessage(payload.new as AdminEmployeeMessage);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function getMyAdminMessages(
  employeeId: string,
): Promise<AdminEmployeeMessage[]> {
  const { data, error } = await supabase
    .from("employee_admin_messages")
    .select("id, employee_id, title, message, message_type, created_at, status, done_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminEmployeeMessage[];
}

export async function updateMyAdminMessageStatus(
  employeeId: string,
  messageId: string,
  status: "pending" | "done",
) {
  const { data, error } = await supabase
    .from("employee_admin_messages")
    .update({ status, done_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", messageId)
    .eq("employee_id", employeeId)
    .select("id, employee_id, title, message, message_type, created_at, status, done_at")
    .single();
  if (error) throw error;
  return data as AdminEmployeeMessage;
}
