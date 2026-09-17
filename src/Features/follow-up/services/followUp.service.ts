import dayjs from "dayjs";
import { supabase } from "../../../services/supabase/supabase";

export type FollowUpRecord = {
  id: string;
  visitType: "Doctor" | "Dealer" | "Farmer";
  partyId: string | null;
  partyName: string;
  followUpDate: string;
  visitDate: string;
  visitTime: string;
  location: string;
  discussion: string;
  outcome: string;
  productIds: string[];
  completed: boolean;
  completedVisitDate: string | null;
  delayDays: number;
};

async function productIdsFor(table: string, visitIds: string[]) {
  if (!visitIds.length) return new Map<string, string[]>();
  const { data, error } = await supabase.from(table).select("visit_id, product_id").in("visit_id", visitIds);
  if (error) throw error;
  const map = new Map<string, string[]>();
  (data ?? []).forEach((row: any) => {
    const list = map.get(row.visit_id) ?? [];
    list.push(row.product_id);
    map.set(row.visit_id, list);
  });
  return map;
}

function daysBetween(start: string, end: string) {
  const a = dayjs(start);
  const b = dayjs(end);
  return Math.max(0, b.startOf("day").diff(a.startOf("day"), "day"));
}

export async function getFollowUps(employeeId: string): Promise<FollowUpRecord[]> {
  if (!employeeId) return [];

  const [
    { data: doctors, error: doctorError },
    { data: dealers, error: dealerError },
    { data: farmers, error: farmerError },
  ] = await Promise.all([
    supabase.from("doctor_visits").select("*").eq("employee_id", employeeId).order("visit_date"),
    supabase.from("dealer_visits").select("*").eq("employee_id", employeeId).order("visit_date"),
    supabase.from("farmer_visits").select("*").eq("employee_id", employeeId).order("visit_date"),
  ]);

  if (doctorError) throw doctorError;
  if (dealerError) throw dealerError;
  if (farmerError) throw farmerError;

  const doctorAllRows: any[] = doctors ?? [];
  const dealerAllRows: any[] = dealers ?? [];
  const farmerAllRows: any[] = farmers ?? [];

  const doctorRows = doctorAllRows.filter((r) => r.next_followup_date);
  const dealerRows = dealerAllRows.filter((r) => r.next_followup_date);
  const farmerRows = farmerAllRows.filter((r) => r.next_followup_date);

  const [doctorProducts, dealerProducts, farmerProducts] = await Promise.all([
    productIdsFor("doctor_visit_products", doctorRows.map(r => r.id)),
    productIdsFor("dealer_visit_products", dealerRows.map(r => r.id)),
    productIdsFor("farmer_visit_products", farmerRows.map(r => r.id)),
  ]);

  const doctorIds = [...new Set(doctorRows.map(r => r.doctor_id).filter(Boolean))];
  const dealerIds = [...new Set(dealerRows.map(r => r.dealer_id).filter(Boolean))];
  const [{ data: doctorMaster, error: dme }, { data: dealerMaster, error: dle }] = await Promise.all([
    doctorIds.length ? supabase.from("doctors").select("id, doctor_name").in("id", doctorIds) : Promise.resolve({ data: [], error: null } as any),
    dealerIds.length ? supabase.from("dealers").select("id, dealer_name").in("id", dealerIds) : Promise.resolve({ data: [], error: null } as any),
  ]);
  if (dme) throw dme;
  if (dle) throw dle;

  const doctorMap = new Map((doctorMaster ?? []).map((r:any)=>[r.id,r.doctor_name ?? ""]));
  const dealerMap = new Map((dealerMaster ?? []).map((r:any)=>[r.id,r.dealer_name ?? ""]));

  const doctorBase = doctorRows.map(r => ({
    id: r.id, visitType: "Doctor" as const, partyId: r.doctor_id ?? null,
    partyName: doctorMap.get(r.doctor_id) ?? "Unknown Doctor",
    followUpDate: r.next_followup_date ?? "", visitDate: r.visit_date ?? "", visitTime: r.visit_time ?? "",
    location: r.location ?? "", discussion: r.discussion ?? "", outcome: r.outcome ?? "",
    productIds: doctorProducts.get(r.id) ?? [],
  }));
  const dealerBase = dealerRows.map(r => ({
    id: r.id, visitType: "Dealer" as const, partyId: r.dealer_id ?? null,
    partyName: dealerMap.get(r.dealer_id) ?? "Unknown Dealer",
    followUpDate: r.next_followup_date ?? "", visitDate: r.visit_date ?? "", visitTime: r.visit_time ?? "",
    location: r.location ?? "", discussion: r.discussion ?? "", outcome: r.outcome ?? "",
    productIds: dealerProducts.get(r.id) ?? [],
  }));
  const farmerBase = farmerRows.map(r => ({
    id: r.id, visitType: "Farmer" as const, partyId: null,
    partyName: r.farmer_name ?? "Unknown Farmer",
    followUpDate: r.next_followup_date ?? "", visitDate: r.visit_date ?? "", visitTime: r.visit_time ?? "",
    location: r.location ?? "", discussion: r.discussion ?? "", outcome: r.outcome ?? "",
    productIds: farmerProducts.get(r.id) ?? [],
  }));

  const allDoctor = doctorAllRows.map(r => ({ id:r.id, visitDate:r.visit_date ?? "", partyId:r.doctor_id ?? null }));
  const allDealer = dealerAllRows.map(r => ({ id:r.id, visitDate:r.visit_date ?? "", partyId:r.dealer_id ?? null }));
  const allFarmer = farmerAllRows.map(r => ({ id:r.id, visitDate:r.visit_date ?? "", partyId:r.farmer_name ?? null }));

  const enrich = (base: any[], all: any[]) => base.map((row: any) => {
    const candidates = all
      .filter((v) => v.id !== row.id && v.partyId === row.partyId && v.visitDate >= row.followUpDate && v.visitDate >= row.visitDate)
      .sort((a,b) => a.visitDate.localeCompare(b.visitDate));
    const completion = candidates[0] ?? null;
    return {
      ...row,
      completed: Boolean(completion),
      completedVisitDate: completion?.visitDate ?? null,
      delayDays: completion ? daysBetween(row.followUpDate, completion.visitDate) : 0,
    };
  });

  return [...enrich(doctorBase, allDoctor), ...enrich(dealerBase, allDealer), ...enrich(farmerBase, allFarmer)]
    .sort((a,b) => a.followUpDate.localeCompare(b.followUpDate));
}

export async function getUpcomingFollowUps(employeeId: string): Promise<FollowUpRecord[]> {
  const rows = await getFollowUps(employeeId);
  const today = dayjs().format("YYYY-MM-DD");
  return rows.filter((row) => !row.completed && row.followUpDate >= today);
}
