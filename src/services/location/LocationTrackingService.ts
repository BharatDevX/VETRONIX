import * as Location from "expo-location";
import * as Network from "expo-network";
import * as TaskManager from "expo-task-manager";

import { supabase } from "../supabase/supabase";

const LIVE_LOCATIONS_TABLE = "employee_live_locations";
const LOCATION_HISTORY_TABLE = "employee_location_history";
const WORK_SESSIONS_TABLE = "work_sessions";
const BACKGROUND_TASK = "VETRONIX_EMPLOYEE_LOCATION_TASK";

// The phone can receive much more frequent native GPS updates, but we only
// persist a journey checkpoint after approximately 5 km of movement. This
// keeps the journey professional and lightweight while the live-location row
// remains continuously updated for the Admin Panel.
const CHECKPOINT_DISTANCE_KM = 5;
const FOREGROUND_INTERVAL_MS = 60 * 1000;

let trackingTimer: ReturnType<typeof setInterval> | null = null;
let locationSubscription: Location.LocationSubscription | null = null;
let activeEmployeeId: string | null = null;
let activeSessionId: string | null = null;

// GPS callbacks can arrive while the previous Supabase write is still running.
// Serializing them prevents two checkpoints from racing past the 5 km threshold.
let trackingWritePromise: Promise<unknown> = Promise.resolve();

interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  batteryLevel?: number | null;
}

function distanceKm(a: LocationSnapshot, b: LocationSnapshot) {
  const earthRadius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function reverseAddress(snapshot: LocationSnapshot) {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
    });
    const place = results[0];
    if (!place) return null;

    return [place.name, place.district, place.city, place.region]
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .join(", ") || null;
  } catch {
    return null;
  }
}

async function getLastHistoryPoint(employeeId: string, sessionId?: string | null) {
  let query = supabase
    .from(LOCATION_HISTORY_TABLE)
    .select("latitude, longitude, cumulative_km, session_id")
    .eq("employee_id", employeeId)
    .order("recorded_at", { ascending: false })
    .limit(1);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data } = await query.maybeSingle();

  return data as {
    latitude: number;
    longitude: number;
    cumulative_km: number;
    session_id: string | null;
  } | null;
}

async function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

async function getActiveSessionId(employeeId: string) {
  const today = await getTodayDate();

  const { data } = await supabase
    .from(WORK_SESSIONS_TABLE)
    .select("id")
    .eq("employee_id", employeeId)
    .eq("work_date", today)
    .eq("status", "started")
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

async function upsertLiveLocation(
  employeeId: string,
  snapshot: LocationSnapshot,
  isWorking: boolean,
  sessionId?: string | null,
) {
  const online = await locationTrackingService.isOnline();
  if (!online) return false;

  const now = new Date().toISOString();

  const { error } = await supabase.from(LIVE_LOCATIONS_TABLE).upsert(
    {
      employee_id: employeeId,
      session_id: sessionId ?? null,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      accuracy: snapshot.accuracy ?? null,
      speed: snapshot.speed ?? null,
      heading: snapshot.heading ?? null,
      battery_level: snapshot.batteryLevel ?? null,
      is_working: isWorking,
      updated_at: now,
      created_at: now,
    },
    { onConflict: "employee_id" },
  );

  if (error) throw error;
  return true;
}

async function recordCheckpoint(
  employeeId: string,
  snapshot: LocationSnapshot,
  sessionId?: string | null,
  force = false,
) {
  const online = await locationTrackingService.isOnline();
  if (!online) return false;

  const now = new Date().toISOString();
  const previous = await getLastHistoryPoint(employeeId, sessionId);

  const segment = previous ? distanceKm(previous, snapshot) : 0;

  // Do not fill Supabase with 100m/1-minute points. The journey history is
  // intentionally checkpoint-based: approximately every 5 km, plus the first
  // location and the final End Work location.
  if (previous && !force && segment < CHECKPOINT_DISTANCE_KM) {
    return false;
  }

  const cumulative = Number(
    (Number(previous?.cumulative_km ?? 0) + segment).toFixed(3),
  );
  const address = await reverseAddress(snapshot);

  const { error } = await supabase.from(LOCATION_HISTORY_TABLE).insert({
    employee_id: employeeId,
    session_id: sessionId ?? null,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    accuracy: snapshot.accuracy ?? null,
    speed: snapshot.speed ?? null,
    heading: snapshot.heading ?? null,
    battery_level: snapshot.batteryLevel ?? null,
    address,
    distance_from_previous_km: Number(segment.toFixed(3)),
    cumulative_km: cumulative,
    recorded_at: now,
  });

  if (error) throw error;

  return true;
}

async function recordLocation(
  employeeId: string,
  snapshot: LocationSnapshot,
  isWorking: boolean,
  sessionId?: string | null,
  forceCheckpoint = false,
) {
  const resolvedSessionId =
    sessionId ?? activeSessionId ?? await getActiveSessionId(employeeId);

  // Live position is updated on every native/foreground GPS update.
  // Journey history is stored only at checkpoints.
  await upsertLiveLocation(employeeId, snapshot, isWorking, resolvedSessionId);
  await recordCheckpoint(
    employeeId,
    snapshot,
    resolvedSessionId,
    forceCheckpoint,
  );

  return true;
}

async function getBackgroundEmployeeId() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user.id) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_id", data.session.user.id)
    .maybeSingle();

  return employee?.id ?? null;
}

function enqueueTrackingWrite<T>(operation: () => Promise<T>): Promise<T> {
  const next = trackingWritePromise.then(operation, operation);
  trackingWritePromise = next.catch(() => undefined);
  return next;
}

async function processForegroundLocation(location: Location.LocationObject) {
  const employeeId = activeEmployeeId;
  if (!employeeId) return;

  await enqueueTrackingWrite(() =>
    recordLocation(
      employeeId,
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        batteryLevel: null,
      },
      true,
      activeSessionId,
      false,
    ),
  );
}

TaskManager.defineTask(BACKGROUND_TASK, async ({ data, error }) => {
  if (error || !data) return;

  const employeeId = activeEmployeeId ?? await getBackgroundEmployeeId();
  if (!employeeId) return;

  const locations =
    (data as { locations?: Location.LocationObject[] }).locations ?? [];
  const location = locations[locations.length - 1];
  if (!location) return;

  const sessionId =
    activeSessionId ?? await getActiveSessionId(employeeId);

  // If there is no active session, do not continue recording background
  // movement. This prevents stale tracking after End Work.
  if (!sessionId) return;

  await enqueueTrackingWrite(() =>
    recordLocation(
      employeeId,
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        batteryLevel: null,
      },
      true,
      sessionId,
      false,
    ),
  );
});

export const locationTrackingService = {
  async requestPermissions(): Promise<boolean> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return false;
    return true;
  },

  async requestBackgroundPermissions(): Promise<boolean> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return false;

    const background = await Location.requestBackgroundPermissionsAsync();
    return background.granted;
  },

  async getCurrentLocation(): Promise<LocationSnapshot> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      heading: location.coords.heading,
      batteryLevel: null,
    };
  },

  async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.isConnected ?? false;
    } catch {
      return true;
    }
  },

  async syncLiveLocation(
    employeeId: string,
    snapshot?: LocationSnapshot,
    isWorking = true,
    sessionId?: string | null,
    forceCheckpoint = false,
  ): Promise<boolean> {
    const currentSnapshot =
      snapshot ?? await this.getCurrentLocation();

    return recordLocation(
      employeeId,
      currentSnapshot,
      isWorking,
      sessionId,
      forceCheckpoint,
    );
  },

  async startTracking(
    employeeId: string,
    snapshot: LocationSnapshot,
    sessionId?: string | null,
  ): Promise<void> {
    activeEmployeeId = employeeId;
    activeSessionId = sessionId ?? await getActiveSessionId(employeeId);

    // First attendance/work location is always a checkpoint.
    await this.syncLiveLocation(
      employeeId,
      snapshot,
      true,
      activeSessionId,
      true,
    );

    if (trackingTimer) {
      clearInterval(trackingTimer);
      trackingTimer = null;
    }
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    // Foreground native watcher: unlike repeatedly calling
    // getCurrentPositionAsync(), this receives actual GPS movement updates.
    // The service still persists journey checkpoints only around every 5 km.
    try {
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000,
          distanceInterval: 100,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          void processForegroundLocation(location);
        },
      );
    } catch {
      // Keep a timer fallback for devices where the native watcher cannot be
      // started. The background task is also attempted below.
      trackingTimer = setInterval(() => {
        if (activeEmployeeId) {
          void enqueueTrackingWrite(() =>
            this.syncLiveLocation(
              activeEmployeeId!,
              undefined,
              true,
              activeSessionId,
              false,
            ),
          );
        }
      }, FOREGROUND_INTERVAL_MS);
    }

    try {
      const hasBackgroundPermission =
        await this.requestBackgroundPermissions();
      const running =
        await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK);

      if (hasBackgroundPermission && !running) {
        await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
          accuracy: Location.Accuracy.Balanced,

          // Native GPS updates can be frequent; the service decides when a
          // checkpoint is worth persisting based on distance travelled.
          timeInterval: 30000,
          distanceInterval: 100,

          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,

          foregroundService: {
            notificationTitle: "VETRONIX field tracking active",
            notificationBody:
              "Your work location is being recorded until End Work.",
            notificationColor: "#2563eb",
          },
        });
      }
    } catch {
      // Foreground timer remains as a safe fallback when OS background
      // permission/configuration is unavailable.
    }
  },

  async stopTracking(
    employeeId: string,
    snapshot: LocationSnapshot,
    sessionId?: string | null,
  ): Promise<boolean> {
    if (trackingTimer) {
      clearInterval(trackingTimer);
      trackingTimer = null;
    }
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    try {
      const running =
        await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK);

      if (running) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
      }
    } catch {
      // Ignore shutdown race.
    }

    // Keep the active identifiers until the final forced checkpoint is saved.
    const result = await this.syncLiveLocation(
      employeeId,
      snapshot,
      false,
      sessionId ?? activeSessionId,
      true,
    );

    activeEmployeeId = null;
    activeSessionId = null;

    return result;
  },
};
