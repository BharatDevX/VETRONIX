import { supabase } from "@/services/supabase";

export interface OrganizationSettings {
  address: string | null;
  branches: string[];
  designations: string[];
  id: string;
  name: string;
  updated_at: string;
}

export async function getOrganizationSettings() {
  const { data, error } = await supabase.from("organization_settings").select("*").limit(1).maybeSingle();
  if (error) {
    throw error;
  }
  return data as OrganizationSettings | null;
}

export async function saveOrganizationSettings(payload: Partial<OrganizationSettings>) {
  const { data, error } = await supabase.from("organization_settings").upsert(payload).select().single();
  if (error) {
    throw error;
  }
  return data as OrganizationSettings;
}
