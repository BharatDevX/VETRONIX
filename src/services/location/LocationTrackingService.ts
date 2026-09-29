import * as Location from "expo-location";
import * as Network from "expo-network";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "../supabase/supabase";

const LIVE_LOCATIONS_TABLE = "employee_live_locations";
const LOCATION_HISTORY_TABLE = "employee_location_history";
const WORK_SESSIONS_TABLE = "work_sessions";
const BACKGROUND_TASK = "VETRONIX_EMPLOYEE_LOCATION_TASK";

// The phone can receive much more frequent native GPS updates,
// but we only persist a journey checkpoint after approximately
// 5 km of movement.
const CHECKPOINT_DISTANCE_KM = 5;

const FOREGROUND_INTERVAL_MS = 60 * 1000;

let trackingTimer: ReturnType<typeof setInterval> | null = null;
let locationSubscription: Location.LocationSubscription | null = null;

let activeEmployeeId: string | null = null;
let activeSessionId: string | null = null;

// GPS callbacks can arrive while the previous Supabase write
// is still running. Serialize writes so they don't race.
let trackingWritePromise: Promise<unknown> = Promise.resolve();

interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  batteryLevel?: number | null;
}

interface TrackingDistanceState {
  sessionId: string;
  lastPoint: LocationSnapshot;
  cumulativeKm: number;
  checkpointKm: number;
}

const DISTANCE_STATE_PREFIX = "vetronix_tracking_distance_state_";

function getDistanceStateKey(sessionId: string) {
  return `${DISTANCE_STATE_PREFIX}${sessionId}`;
}

async function saveDistanceState(state: TrackingDistanceState) {
  try {
    await AsyncStorage.setItem(
      getDistanceStateKey(state.sessionId),
      JSON.stringify(state)
    );
  } catch (error) {
    console.log(
      "[VETRONIX TRACKING] Distance state save failed:",
      error
    );
  }
}

async function loadDistanceState(sessionId: string) {
  try {
    const raw = await AsyncStorage.getItem(
      getDistanceStateKey(sessionId)
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw) as TrackingDistanceState;

    if (
      parsed?.sessionId !== sessionId ||
      !parsed?.lastPoint ||
      !Number.isFinite(parsed.cumulativeKm) ||
      !Number.isFinite(parsed.checkpointKm)
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.log(
      "[VETRONIX TRACKING] Distance state load failed:",
      error
    );

    return null;
  }
}

async function clearDistanceState(sessionId: string) {
  try {
    await AsyncStorage.removeItem(
      getDistanceStateKey(sessionId)
    );
  } catch (error) {
    console.log(
      "[VETRONIX TRACKING] Distance state cleanup failed:",
      error
    );
  }
}

function distanceKm(a: LocationSnapshot, b: LocationSnapshot) {
  const earthRadius = 6371;

  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;

  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

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
      .filter(
        (value, index, list) =>
          list.indexOf(value) === index
      )
      .join(", ") || null;
  } catch (error) {
    console.log(
      "[VETRONIX TRACKING] Reverse geocode failed:",
      error
    );

    return null;
  }
}

async function getLastHistoryPoint(
  employeeId: string,
  sessionId?: string | null
) {
  let query = supabase
    .from(LOCATION_HISTORY_TABLE)
    .select(
      "latitude, longitude, cumulative_km, session_id"
    )
    .eq("employee_id", employeeId)
    .order("recorded_at", { ascending: false })
    .limit(1);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.log(
      "[VETRONIX TRACKING] Last history lookup failed:",
      error.message
    );

    return null;
  }

  return data as {
    latitude: number;
    longitude: number;
    cumulative_km: number;
    session_id: string | null;
  } | null;
}

async function getTodayDate() {
  const now = new Date();

  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(
    2,
    "0"
  )}-${`${now.getDate()}`.padStart(2, "0")}`;
}

async function getActiveSessionId(employeeId: string) {
  const today = await getTodayDate();

  const { data, error } = await supabase
    .from(WORK_SESSIONS_TABLE)
    .select("id")
    .eq("employee_id", employeeId)
    .eq("work_date", today)
    .eq("status", "started")
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log(
      "[VETRONIX TRACKING] Active session lookup failed:",
      error.message
    );

    return null;
  }

  return data?.id ?? null;
}

/**
 * Make sure the background JS runtime has a valid Supabase session.
 *
 * Android can keep the foreground service alive while the normal
 * React Native runtime is suspended. Therefore we explicitly check
 * the session and refresh it when it is expired/about to expire.
 */
async function ensureBackgroundSession() {
  try {
    const { data, error } =
      await supabase.auth.getSession();

    if (error) {
      console.log(
        "[VETRONIX TRACKING] getSession failed:",
        error.message
      );

      return null;
    }

    let session = data.session;

    if (!session) {
      console.log(
        "[VETRONIX TRACKING] No Supabase session available"
      );

      return null;
    }

    const expiresAt = session.expires_at ?? 0;

    const now = Math.floor(Date.now() / 1000);

    // Refresh if token expires within the next minute.
    if (expiresAt <= now + 60) {
      console.log(
        "[VETRONIX TRACKING] Refreshing Supabase session..."
      );

      const {
        data: refreshed,
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError || !refreshed.session) {
        console.log(
          "[VETRONIX TRACKING] Session refresh failed:",
          refreshError?.message ?? "No refreshed session"
        );

        return null;
      }

      session = refreshed.session;
    }

    return session;
  } catch (error) {
    console.log(
      "[VETRONIX TRACKING] Session handling failed:",
      error
    );

    return null;
  }
}

async function getBackgroundEmployeeId() {
  const session = await ensureBackgroundSession();

  if (!session?.user?.id) {
    return null;
  }

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.log(
      "[VETRONIX TRACKING] Employee lookup failed:",
      error.message
    );

    return null;
  }

  return employee?.id ?? null;
}

/**
 * Update the Admin Panel's live-location row.
 *
 * This is intentionally independent from the 5 km checkpoint
 * history system.
 */
async function upsertLiveLocation(
  employeeId: string,
  snapshot: LocationSnapshot,
  isWorking: boolean,
  sessionId?: string | null
) {
  const online = await locationTrackingService.isOnline();

  if (!online) {
    console.log(
      "[VETRONIX TRACKING] Network reported offline"
    );

    return false;
  }

  // Make sure the background runtime has a valid Supabase session.
  const session = await ensureBackgroundSession();

  if (!session) {
    console.log(
      "[VETRONIX TRACKING] No valid Supabase session for live update"
    );

    return false;
  }

  const now = new Date().toISOString();

  const payload = {
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
  };

  let { error } = await supabase
    .from(LIVE_LOCATIONS_TABLE)
    .upsert(payload, {
      onConflict: "employee_id",
    });

  // If the token expired between the session check and the
  // database request, refresh once and retry.
  if (error) {
    console.log(
      "[VETRONIX TRACKING] Live location write failed:",
      error.message
    );

    const refreshedSession =
      await ensureBackgroundSession();

    if (!refreshedSession) {
      return false;
    }

    const retry = await supabase
      .from(LIVE_LOCATIONS_TABLE)
      .upsert(payload, {
        onConflict: "employee_id",
      });

    error = retry.error;

    if (error) {
      console.log(
        "[VETRONIX TRACKING] Live location retry failed:",
        error.message
      );

      return false;
    }
  }

  return true;
}

async function recordCheckpoint(
  employeeId: string,
  snapshot: LocationSnapshot,
  sessionId?: string | null,
  force = false,
  distanceState?: TrackingDistanceState | null
) {
  const online = await locationTrackingService.isOnline();

  if (!online) {
    console.log(
      "[VETRONIX TRACKING] Checkpoint skipped: offline"
    );

    return false;
  }

  const session = await ensureBackgroundSession();

  if (!session) {
    console.log(
      "[VETRONIX TRACKING] Checkpoint skipped: no session"
    );

    return false;
  }

  const resolvedSessionId = sessionId ?? distanceState?.sessionId;

  if (!resolvedSessionId) {
    return false;
  }

  const now = new Date().toISOString();

  // DistanceState.cumulativeKm is calculated from EVERY GPS sample.
  // checkpointKm is the travelled distance since the last history row.
  const cumulative = Number(
    (distanceState?.cumulativeKm ?? 0).toFixed(3)
  );

  const checkpointDistance = Number(
    (distanceState?.checkpointKm ?? 0).toFixed(3)
  );

  if (
    !force &&
    checkpointDistance < CHECKPOINT_DISTANCE_KM
  ) {
    return false;
  }

  const address = await reverseAddress(snapshot);

  const { error } = await supabase
    .from(LOCATION_HISTORY_TABLE)
    .insert({
      employee_id: employeeId,
      session_id: resolvedSessionId,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      accuracy: snapshot.accuracy ?? null,
      speed: snapshot.speed ?? null,
      heading: snapshot.heading ?? null,
      battery_level: snapshot.batteryLevel ?? null,
      address,
      distance_from_previous_km: checkpointDistance,
      cumulative_km: cumulative,
      recorded_at: now,
    });

  if (error) {
    console.log(
      "[VETRONIX TRACKING] Checkpoint write failed:",
      error.message
    );

    return false;
  }

  if (distanceState) {
    distanceState.checkpointKm = 0;
    await saveDistanceState(distanceState);
  }

  return true;
}

async function recordLocation(
  employeeId: string,
  snapshot: LocationSnapshot,
  isWorking: boolean,
  sessionId?: string | null,
  forceCheckpoint = false
) {
  const resolvedSessionId =
    sessionId ??
    activeSessionId ??
    (await getActiveSessionId(employeeId));

  if (!resolvedSessionId) {
    console.log(
      "[VETRONIX TRACKING] No session for location"
    );

    return false;
  }

  /*
   * IMPORTANT:
   * Distance is now accumulated from every GPS sample, not from
   * the last 5-km checkpoint. This prevents long journeys from
   * being under-counted when Android delivers multiple GPS points
   * between checkpoint writes.
   */
  let distanceState =
    await loadDistanceState(resolvedSessionId);

  if (!distanceState) {
    const previous = await getLastHistoryPoint(
      employeeId,
      resolvedSessionId
    );

    distanceState = {
      sessionId: resolvedSessionId,
      lastPoint: previous
        ? {
            latitude: previous.latitude,
            longitude: previous.longitude,
            accuracy: null,
            speed: null,
            heading: null,
            batteryLevel: null,
          }
        : snapshot,
      cumulativeKm: Number(
        previous?.cumulative_km ?? 0
      ),
      checkpointKm: 0,
    };
  }

  // Calculate this segment from the PREVIOUS GPS sample.
  const segment = distanceKm(
    distanceState.lastPoint,
    snapshot
  );

  // Ignore impossible GPS jumps. A single GPS point should not
  // add thousands of kilometres because of a bad fix.
  const MAX_REASONABLE_SINGLE_SEGMENT_KM = 10;

  const validSegment =
    Number.isFinite(segment) &&
    segment >= 0 &&
    segment <= MAX_REASONABLE_SINGLE_SEGMENT_KM
      ? segment
      : 0;

  distanceState.cumulativeKm = Number(
    (
      distanceState.cumulativeKm +
      validSegment
    ).toFixed(3)
  );

  distanceState.checkpointKm = Number(
    (
      distanceState.checkpointKm +
      validSegment
    ).toFixed(3)
  );

  // Advance the raw GPS point EVERY TIME, even when no checkpoint
  // is written. This is the key fix for accurate long journeys.
  distanceState.lastPoint = snapshot;

  await saveDistanceState(distanceState);

  // Live position is still updated on every GPS event.
  const liveUpdated = await upsertLiveLocation(
    employeeId,
    snapshot,
    isWorking,
    resolvedSessionId
  );

  if (!liveUpdated) {
    console.log(
      "[VETRONIX TRACKING] Live location was not updated"
    );
  }

  // History remains lightweight: approximately one checkpoint
  // every 5 km, plus first/final location.
  await recordCheckpoint(
    employeeId,
    snapshot,
    resolvedSessionId,
    forceCheckpoint,
    distanceState
  );

  return liveUpdated;
}

function enqueueTrackingWrite<T>(
  operation: () => Promise<T>
): Promise<T> {
  const next = trackingWritePromise.then(
    operation,
    operation
  );

  trackingWritePromise = next.catch(
    () => undefined
  );

  return next;
}

async function processForegroundLocation(
  location: Location.LocationObject
) {
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
      false
    )
  );
}

/**
 * BACKGROUND LOCATION TASK
 *
 * Android can execute this task while the screen is locked
 * or Vetronix is not the foreground application.
 */
TaskManager.defineTask(
  BACKGROUND_TASK,
  async ({ data, error }) => {
    if (error) {
      console.log(
        "[VETRONIX TRACKING] Background task error:",
        error
      );

      return;
    }

    if (!data) return;

    console.log(
      "[VETRONIX TRACKING] Background GPS event received"
    );

    /**
     * The normal React runtime may be suspended.
     * Therefore restore/refresh Supabase authentication first.
     */
    const session = await ensureBackgroundSession();

    if (!session?.user?.id) {
      console.log(
        "[VETRONIX TRACKING] Background task has no valid session"
      );

      return;
    }

    /**
     * activeEmployeeId can be null because this is a separate
     * background JS execution. Resolve it from Supabase.
     */
    const employeeId =
      activeEmployeeId ??
      (await getBackgroundEmployeeId());

    if (!employeeId) {
      console.log(
        "[VETRONIX TRACKING] Could not resolve employee"
      );

      return;
    }

    const locations =
      (
        data as {
          locations?: Location.LocationObject[];
        }
      ).locations ?? [];

    if (locations.length === 0) {
      console.log(
        "[VETRONIX TRACKING] Background event had no locations"
      );

      return;
    }

    /**
     * Resolve the active work session.
     */
    const sessionId =
      activeSessionId ??
      (await getActiveSessionId(employeeId));

    /**
     * Never continue tracking after End Work.
     */
    if (!sessionId) {
      console.log(
        "[VETRONIX TRACKING] No active work session"
      );

      return;
    }

    /**
     * Android can deliver several locations in one background
     * callback. DO NOT throw the earlier points away.
     *
     * Every sample is processed in chronological order so the
     * distance is the sum of all GPS segments.
     */
    await enqueueTrackingWrite(async () => {
      const orderedLocations = [...locations].sort(
        (a, b) =>
          (a.timestamp ?? 0) -
          (b.timestamp ?? 0)
      );

      for (const location of orderedLocations) {
        await recordLocation(
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
          false
        );
      }
    });
  }
);

export const locationTrackingService = {
  async requestPermissions(): Promise<boolean> {
    const foreground =
      await Location.requestForegroundPermissionsAsync();

    if (!foreground.granted) {
      return false;
    }

    return true;
  },

  async requestBackgroundPermissions(): Promise<boolean> {
    // Android requires foreground permission before
    // requesting background permission.
    const foreground =
      await Location.getForegroundPermissionsAsync();

    if (!foreground.granted) {
      const requested =
        await Location.requestForegroundPermissionsAsync();

      if (!requested.granted) {
        return false;
      }
    }

    const background =
      await Location.getBackgroundPermissionsAsync();

    if (background.granted) {
      return true;
    }

    const requestedBackground =
      await Location.requestBackgroundPermissionsAsync();

    return requestedBackground.granted;
  },

  async getCurrentLocation(): Promise<LocationSnapshot> {
    const location =
      await Location.getCurrentPositionAsync({
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
      const state =
        await Network.getNetworkStateAsync();

      return state.isConnected ?? false;
    } catch (error) {
      console.log(
        "[VETRONIX TRACKING] Network check failed:",
        error
      );

      // Don't block tracking just because the network-state
      // API itself failed.
      return true;
    }
  },

  async syncLiveLocation(
    employeeId: string,
    snapshot?: LocationSnapshot,
    isWorking = true,
    sessionId?: string | null,
    forceCheckpoint = false
  ): Promise<boolean> {
    const currentSnapshot =
      snapshot ??
      (await this.getCurrentLocation());

    return recordLocation(
      employeeId,
      currentSnapshot,
      isWorking,
      sessionId,
      forceCheckpoint
    );
  },

  async startTracking(
    employeeId: string,
    snapshot: LocationSnapshot,
    sessionId?: string | null
  ): Promise<void> {
    activeEmployeeId = employeeId;

    activeSessionId =
      sessionId ??
      (await getActiveSessionId(employeeId));

    if (activeSessionId) {
      // A new work session always starts a fresh distance state.
      await saveDistanceState({
        sessionId: activeSessionId,
        lastPoint: snapshot,
        cumulativeKm: 0,
        checkpointKm: 0,
      });
    }

    /**
     * First attendance/work location is always
     * stored as a checkpoint.
     */
    await this.syncLiveLocation(
      employeeId,
      snapshot,
      true,
      activeSessionId,
      true
    );

    if (trackingTimer) {
      clearInterval(trackingTimer);
      trackingTimer = null;
    }

    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    /**
     * FOREGROUND WATCHER
     */
    try {
      locationSubscription =
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 15000,
            distanceInterval: 100,
            mayShowUserSettingsDialog: true,
          },
          (location) => {
            void processForegroundLocation(
              location
            );
          }
        );
    } catch (error) {
      console.log(
        "[VETRONIX TRACKING] Foreground watcher failed:",
        error
      );

      /**
       * Timer fallback.
       */
      trackingTimer = setInterval(() => {
        if (activeEmployeeId) {
          void enqueueTrackingWrite(() =>
            this.syncLiveLocation(
              activeEmployeeId!,
              undefined,
              true,
              activeSessionId,
              false
            )
          );
        }
      }, FOREGROUND_INTERVAL_MS);
    }

    /**
     * BACKGROUND PERMISSION + NATIVE BACKGROUND LOCATION
     */
    try {
      const hasBackgroundPermission =
        await this.requestBackgroundPermissions();

      console.log(
        "[VETRONIX TRACKING] Background permission:",
        hasBackgroundPermission
      );

      const running =
        await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_TASK
        );

      if (
        hasBackgroundPermission &&
        !running
      ) {
        await Location.startLocationUpdatesAsync(
          BACKGROUND_TASK,
          {
            accuracy: Location.Accuracy.High,

            /**
             * Native Android service continues delivering
             * locations while Activity is backgrounded or
             * screen is off.
             */
            timeInterval: 15000,
            distanceInterval: 50,

            pausesUpdatesAutomatically: false,

            showsBackgroundLocationIndicator: true,

            foregroundService: {
              notificationTitle:
                "VETRONIX field tracking active",

              notificationBody:
                "Your work location is being recorded until End Work.",

              notificationColor: "#2563eb",

              killServiceOnDestroy: false,
            },
          }
        );

        console.log(
          "[VETRONIX TRACKING] Background location started"
        );
      }
    } catch (error) {
      console.log(
        "[VETRONIX TRACKING] Background tracking start failed:",
        error
      );

      /**
       * Foreground watcher/timer remains available.
       */
    }
  },

  async stopTracking(
    employeeId: string,
    snapshot: LocationSnapshot,
    sessionId?: string | null
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
        await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_TASK
        );

      if (running) {
        await Location.stopLocationUpdatesAsync(
          BACKGROUND_TASK
        );
      }
    } catch (error) {
      console.log(
        "[VETRONIX TRACKING] Background shutdown error:",
        error
      );
    }

    /**
     * Keep active identifiers until the final forced
     * checkpoint/live-location update has completed.
     */
    const result =
      await this.syncLiveLocation(
        employeeId,
        snapshot,
        false,
        sessionId ?? activeSessionId,
        true
      );

    const completedSessionId =
      sessionId ?? activeSessionId;

    if (completedSessionId) {
      await clearDistanceState(completedSessionId);
    }

    activeEmployeeId = null;
    activeSessionId = null;

    return result;
  },
};