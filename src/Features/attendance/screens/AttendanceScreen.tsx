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

export default function AttendanceScreen() {
  const { employee } = useAuthStore();

  const {
    loading,
    todayAttendance,
    loadTodayAttendance,
    requestLocation,
    saveAttendance,
  } = useAttendance();

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

      Alert.alert(
        "Success",
        "Attendance marked successfully."
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
          gap: 16,
        }}
      >
        <AppCard>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today's Overview</Text>

            <View
              style={[
                styles.statusPill,
                { backgroundColor: `${activeStatus.color}1A` },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: activeStatus.color },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: activeStatus.color },
                ]}
              >
                {activeStatus.label}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {dayjs().format("DD MMM YYYY")}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>
              {dayjs().format("hh:mm A")}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Location</Text>
            <Text
              style={[styles.value, styles.locationValue]}
              numberOfLines={1}
            >
              {locationText}
            </Text>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Attendance Status</Text>
          <Text style={styles.cardSubtitle}>
            Select how today should be recorded
          </Text>

          <View style={{ marginTop: 12 }}>
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

        <AppCard>
          <Text style={styles.cardTitle}>Remarks</Text>
          <Text style={styles.cardSubtitle}>Optional note for today</Text>

          <View style={{ marginTop: 12 }}>
            <AppInput
              label=""
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Add a remark (optional)"
            />
          </View>
        </AppCard>

        <PrimaryButton
          title="Mark Attendance"
          loading={loading}
          onPress={handleAttendance}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D1F",
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#8A8F98",
    marginTop: 2,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF0F4",
  },

  label: {
    fontWeight: "500",
    fontSize: 14,
    color: "#6B7280",
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1D1F",
  },

  locationValue: {
    maxWidth: "60%",
    textAlign: "right",
  },
});