import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocalPartyType = "doctor" | "dealer" | "farmer";
export type LocalActivityType = "visit" | "meeting_plan";

export interface LocalParty {
  id: string;
  name: string;
  type: LocalPartyType;
  createdAt: string;
}

export interface LocalActivity {
  id: string;
  employee_id: string;
  party_type: LocalPartyType;
  activity_type: LocalActivityType;
  party_name: string;
  local_only: true;
  created_at: string;
  [key: string]: any;
}

const partyKey = (employeeId: string, type: LocalPartyType) =>
  `vetronix:local-parties:${employeeId}:${type}`;

const activityKey = (employeeId: string, type: LocalPartyType, activity: LocalActivityType) =>
  `vetronix:local-activities:${employeeId}:${type}:${activity}`;

export const isLocalPartyId = (value?: string | null) =>
  Boolean(value && value.startsWith("local-party:"));

export async function getLocalParties(employeeId: string, type: LocalPartyType): Promise<LocalParty[]> {
  if (!employeeId) return [];
  try {
    const raw = await AsyncStorage.getItem(partyKey(employeeId, type));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.name && item?.type === type) : [];
  } catch {
    return [];
  }
}

export async function addLocalParty(employeeId: string, type: LocalPartyType, name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!employeeId || !normalized) return null;

  const existing = await getLocalParties(employeeId, type);
  const duplicate = existing.find((item) => item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase());
  if (duplicate) return duplicate;

  const item: LocalParty = {
    id: `local-party:${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    name: normalized,
    type,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(partyKey(employeeId, type), JSON.stringify([...existing, item]));
  return item;
}

export async function getLocalPartyById(employeeId: string, type: LocalPartyType, id: string) {
  const items = await getLocalParties(employeeId, type);
  return items.find((item) => item.id === id) ?? null;
}

export async function saveLocalActivity(
  employeeId: string,
  partyType: LocalPartyType,
  activityType: LocalActivityType,
  payload: Record<string, any>,
  partyName: string,
) {
  const item: LocalActivity = {
    ...payload,
    id: `local-activity:${activityType}:${partyType}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    employee_id: employeeId,
    party_type: partyType,
    activity_type: activityType,
    party_name: partyName,
    local_only: true,
    created_at: new Date().toISOString(),
  };

  const key = activityKey(employeeId, partyType, activityType);
  let existing: LocalActivity[] = [];
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    existing = Array.isArray(parsed) ? parsed : [];
  } catch {
    existing = [];
  }

  await AsyncStorage.setItem(key, JSON.stringify([item, ...existing]));
  return item;
}

export async function getLocalActivities(
  employeeId: string,
  partyType: LocalPartyType,
  activityType: LocalActivityType,
): Promise<LocalActivity[]> {
  if (!employeeId) return [];
  try {
    const raw = await AsyncStorage.getItem(activityKey(employeeId, partyType, activityType));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
