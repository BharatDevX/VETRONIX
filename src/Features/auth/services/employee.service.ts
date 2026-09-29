import { supabase } from "../../../services/supabase/supabase";

function normalizeHeadQuarters(
  headQuarters: string[] | null | undefined,
  branch?: string | null,
): string[] {
  const source = [
    ...(headQuarters ?? []),
    ...(branch ? [branch] : []),
  ];

  return Array.from(
    new Set(
      source
        .flatMap((value) => String(value).split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export async function getEmployee(authId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_id", authId)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return data;
  }

  return {
    ...data,
    head_quarters: normalizeHeadQuarters(
      data.head_quarters,
      data.branch,
    ),
  };
}
