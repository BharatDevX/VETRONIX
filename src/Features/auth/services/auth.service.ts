import { supabase } from "../../../services/supabase/supabase";

export async function login(
  employeeId: string,
  password: string
) {
  const { data: employee, error: employeeError } =
    await supabase
      .from("employees")
      .select("email")
      .eq("employee_id", employeeId)
      .single();

  if (employeeError || !employee) {
    throw new Error("Invalid Employee ID");
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: employee.email,
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}