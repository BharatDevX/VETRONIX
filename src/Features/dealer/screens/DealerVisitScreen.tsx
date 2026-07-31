import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Alert, StyleSheet, View, Text, Animated, Easing } from "react-native";

import * as Location from "expo-location";
import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import AppInput from "../../../components/ui/AppInput";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AppCard from "../../../components/ui/AppCard";

import { useMasters } from "../../master/hooks/useMasters";
import { useDealerVisit } from "../hooks/useDealerVisit";
import { useAuthStore } from "../../auth/store/auth.store";

type DealerVisitForm = {
  dealer_id: string;
  visit_date: string;
  visit_time: string;
  location: string;
  discussion: string;
  outcome: string;
  next_followup_date: string;
  latitude?: number;
  longitude?: number;
};

const initialForm = (): DealerVisitForm => ({
  dealer_id: "",
  visit_date: dayjs().format("YYYY-MM-DD"),
  visit_time: dayjs().format("HH:mm"),
  location: "",
  discussion: "",
  outcome: "",
  next_followup_date: dayjs().format("YYYY-MM-DD"),
  latitude: undefined,
  longitude: undefined,
});

export default function DealerVisitScreen() {
  const { employee } = useAuthStore();
  const { dealers } = useMasters();
  const { save, saving } = useDealerVisit(employee?.id ?? "");

  const [form, setForm] = useState<DealerVisitForm>(initialForm);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    getLocation();

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

  async function getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});

    setForm((prev) => ({
      ...prev,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      location: `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`,
    }));
  }

  async function saveVisit() {
    if (!form.dealer_id || saving) return;

    try {
      const result = await save(form);
      Alert.alert("Success", result?.isUpdate ? "Existing record updated successfully." : "Saved successfully.");
      setForm(initialForm());
    } catch {
      Alert.alert("Error", "Unable to save the dealer visit right now.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Dealer Visit"
        subtitle="Log a field visit with a dealer"
      />

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
          gap: 16,
        }}
      >
        <AppCard>
          <Text style={styles.cardTitle}>Visit Details</Text>

          <View style={styles.fieldGroup}>
            <AppSearchDropdown
              label="Dealer"
              data={dealers}
              labelField="dealer_name"
              valueField="id"
              value={form.dealer_id}
              onChange={(item) => setForm({ ...form, dealer_id: item.id })}
            />

            <AppDatePicker
              label="Visit Date"
              value={form.visit_date}
              onChange={(date) => setForm({ ...form, visit_date: date })}
            />

            <AppInput
              label="Visit Time"
              placeholder="HH:mm"
              value={form.visit_time}
              onChangeText={(text) => setForm({ ...form, visit_time: text })}
            />

            <AppInput
              label="Location"
              placeholder="Current location"
              value={form.location}
              editable={false}
              onChangeText={() => {}}
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Discussion & Outcome</Text>

          <View style={styles.fieldGroup}>
            <AppInput
              label="Discussion"
              placeholder="Enter discussion"
              multiline
              value={form.discussion}
              onChangeText={(text) => setForm({ ...form, discussion: text })}
            />

            <AppInput
              label="Outcome"
              placeholder="Enter outcome"
              multiline
              value={form.outcome}
              onChangeText={(text) => setForm({ ...form, outcome: text })}
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Follow-up</Text>

          <View style={styles.fieldGroup}>
            <AppDatePicker
              label="Next Follow-up"
              value={form.next_followup_date}
              onChange={(date) => setForm({ ...form, next_followup_date: date })}
            />
          </View>
        </AppCard>

        <PrimaryButton title="Save Visit" onPress={saveVisit} loading={saving} disabled={saving} />
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

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D1F",
    marginBottom: 4,
  },

  fieldGroup: {
    gap: 12,
    marginTop: 8,
  },
});