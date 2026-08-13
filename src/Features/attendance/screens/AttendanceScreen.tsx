import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from "react-native";

import dayjs from "dayjs";

import AppCard from "../../../components/ui/AppCard";
import AppInput from "../../../components/ui/AppInput";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AppRadioGroup from "../../../components/ui/AppRadioGroup";
import ScreenHeader from "../../../components/ui/ScreenHeader";

import { useAttendance } from "../hooks/useAttendance";
import { useAuthStore } from "../../auth/store/auth.store";
import { useWork } from "../../work/hooks/useWork";

export default function AttendanceScreen() {
  const { employee } = useAuthStore();

  const {
    loading,
    todayAttendance,
    loadTodayAttendance,
    requestLocation,
    saveAttendance,
  } = useAttendance();

  // Reuses the exact same startWork() used by StartWorkScreen — same service
  // call, same duplicate-session guard, same background-tracking kickoff.
  const { startWork } = useWork(employee?.id ?? "");

  const [status, setStatus] = useState("PRESENT");
  const [remarks, setRemarks] = useState("");

  const [locationText, setLocationText] =
    useState("Detecting location...");

  // --- animation values (visual only, no logic impact) ---
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (employee) {
      loadTodayAttendance(employee.id);
    }

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleAttendance() {
    try {
      if (!employee) return;

      if (todayAttendance) {
        Alert.alert(
          "Attendance",
          "Attendance already marked."
        );
        return;
      }

      const location = await requestLocation();

      const latitude =
        location.coords.latitude;

      const longitude =
        location.coords.longitude;

      setLocationText(
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      );

      await saveAttendance({
        employee_id: employee.id,
        latitude,
        longitude,
        status: status as any,
        remarks,
      });

      // Attendance succeeded — automatically start today's work session using
      // the SAME coordinates already captured above (no second GPS request,
      // no second permission prompt). This calls the existing startWork(),
      // which already creates the work_sessions row, guards against a
      // duplicate session for today, and starts background tracking.
      let workStarted = false;

      try {
        const session = await startWork({ latitude, longitude });
        workStarted = !!session;
      } catch (workError) {
        // Attendance itself already succeeded and must not be rolled back or
        // reported as a failure just because work-session auto-start hit an
        // edge case (e.g. today's work is already completed). Fall through
        // to the plain success message below.
      }

      Alert.alert(
        "Success",
        workStarted
          ? "Attendance marked successfully.\nWork session started successfully."
          : "Attendance marked successfully."
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message ?? "Something went wrong."
      );
    }
  }

  const statusMeta: Record<string, { label: string; color: string }> = {
    PRESENT: { label: "Present", color: "#1D9C6E" },
    LEAVE: { label: "Leave", color: "#E0562B" },
    HALF_DAY: { label: "Half Day", color: "#C79A1E" },
  };

  const activeStatus = statusMeta[status] ?? statusMeta.PRESENT;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Attendance"
        subtitle="Mark your attendance for today"
      />

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
          gap: 18,
        }}
      >
        {/* ---------- HERO / TODAY OVERVIEW ---------- */}
        <View style={styles.hero}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>TODAY'S OVERVIEW</Text>
            </View>

            <View
              style={[
                styles.statusPill,
                { backgroundColor: "rgba(255,255,255,0.16)" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: activeStatus.color },
                ]}
              />
              <Text style={styles.statusPillText}>{activeStatus.label}</Text>
            </View>
          </View>

          <Text style={styles.heroTime}>{dayjs().format("hh:mm A")}</Text>
          <Text style={styles.heroDate}>{dayjs().format("dddd, DD MMM YYYY")}</Text>

          <View style={styles.heroLocationCard}>
            <Text style={styles.heroLocationLabel}>Current Location</Text>
            <Text style={styles.heroLocationValue} numberOfLines={1}>
              {locationText}
            </Text>
          </View>
        </View>

        {/* ---------- STATUS ---------- */}
        <AppCard>
          <View style={styles.sectionHeadRow}>
            <View style={styles.accentBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Attendance Status</Text>
              <Text style={styles.cardSubtitle}>
                Select how today should be recorded
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <AppRadioGroup
              value={status}
              onChange={setStatus}
              options={[
                {
                  label: "Present",
                  value: "PRESENT",
                },
                {
                  label: "Leave",
                  value: "LEAVE",
                },
                {
                  label: "Half Day",
                  value: "HALF_DAY",
                },
              ]}
            />
          </View>
        </AppCard>

        {/* ---------- REMARKS ---------- */}
        <AppCard>
          <View style={styles.sectionHeadRow}>
            <View style={styles.accentBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Remarks</Text>
              <Text style={styles.cardSubtitle}>Optional note for today</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <AppInput
              label=""
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Add a remark (optional)"
            />
          </View>
        </AppCard>

        <View style={styles.submitWrap}>
          <PrimaryButton
            title="Mark Attendance"
            loading={loading}
            onPress={handleAttendance}
          />
          <Text style={styles.helperNote}>
            Your live location is captured when you mark attendance.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F8FC" },

  container: {
    padding: 20,
    paddingBottom: 44,
    gap: 18,
  },

  /* ---------- HERO ---------- */
  hero: {
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: "#0F76AE",
    overflow: "hidden",
    shadowColor: "#00416E",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },

  heroGlowOne: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -90,
    right: -60,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  heroGlowTwo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    bottom: -110,
    left: -70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  heroBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#FFFFFF",
  },

  heroTime: {
    marginTop: 18,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#FFFFFF",
  },

  heroDate: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: "#CFE8FF",
  },

  heroLocationCard: {
    marginTop: 18,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  heroLocationLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#BFDFFA",
  },

  heroLocationValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* ---------- SECTIONS ---------- */
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  accentBar: {
    width: 4,
    height: 30,
    borderRadius: 3,
    backgroundColor: "#1597D4",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16324F",
  },

  cardSubtitle: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#8697A8",
    marginTop: 3,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  submitWrap: {
    marginTop: 2,
    gap: 10,
  },

  helperNote: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B2",
  },
});
