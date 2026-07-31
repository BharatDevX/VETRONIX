import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Alert, StyleSheet, View, Text, Animated, Easing } from "react-native";

import * as Location from "expo-location";
import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppMultiSelect from "../../../components/ui/AppMultiSelect";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import AppInput from "../../../components/ui/AppInput";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AppCard from "../../../components/ui/AppCard";

import { useMasters } from "../../master/hooks/useMasters";
import { useDoctorVisit } from "../hooks/useDoctorVisit";
import { useAuthStore } from "../../auth/store/auth.store";

export default function DoctorVisitScreen() {
  const { employee } = useAuthStore();

  const { doctors, products } = useMasters();

  const { save } = useDoctorVisit(employee?.id ?? "");

  const [form, setForm] = useState<{
    doctor_id: string;
    visit_date: string;
    visit_time: string;
    location: string;
    discussion: string;
    remarks: string;
    next_followup_date: string;
    latitude?: number;
    longitude?: number;
    product_ids: string[];
  }>({
    doctor_id: "",
    visit_date: dayjs().format("YYYY-MM-DD"),
    visit_time: dayjs().format("HH:mm"),
    location: "",
    discussion: "",
    remarks: "",
    next_followup_date: dayjs().format("YYYY-MM-DD"),
    latitude: undefined,
    longitude: undefined,
    product_ids: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    getCurrentLocation();

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

  async function getCurrentLocation() {
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
    if (!form.doctor_id) {
      Alert.alert("Validation", "Please select a doctor before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await save(form);
      Alert.alert("Success", result?.isUpdate ? "Doctor Visit Updated Successfully" : "Doctor Visit Saved Successfully");
    } catch (e) {
      Alert.alert("Error", "Unable to save visit.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Doctor Visit"
        subtitle="Log a field visit with a doctor"
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
              label="Doctor"
              data={doctors}
              labelField="doctor_name"
              valueField="id"
              value={form.doctor_id}
              onChange={(item) =>
                setForm({
                  ...form,
                  doctor_id: item.id,
                })
              }
            />

            <AppDatePicker
              label="Visit Date"
              value={form.visit_date}
              onChange={(date) =>
                setForm({
                  ...form,
                  visit_date: date,
                })
              }
            />

            <AppInput
              label="Visit Time"
              value={form.visit_time}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  visit_time: text,
                })
              }
              placeholder=""
            />

            <AppInput
              label="Location"
              value={form.location}
              placeholder=""
              editable={false}
              onChangeText={() => {}}
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Discussion</Text>

          <View style={styles.fieldGroup}>
            <AppInput
              label="Discussion"
              value={form.discussion}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  discussion: text,
                })
              }
              placeholder=""
            />

            <AppMultiSelect
              label="Products Discussed"
              data={products}
              labelField="product_name"
              valueField="id"
              value={form.product_ids}
              onChange={(items) =>
                setForm({
                  ...form,
                  product_ids: items,
                })
              }
            />

            <AppInput
              label="Remarks"
              value={form.remarks}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  remarks: text,
                })
              }
              placeholder=""
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Follow-up</Text>

          <View style={styles.fieldGroup}>
            <AppDatePicker
              label="Next Follow-up Date"
              value={form.next_followup_date}
              onChange={(date) =>
                setForm({
                  ...form,
                  next_followup_date: date,
                })
              }
            />
          </View>
        </AppCard>

        <PrimaryButton title="Save Visit" onPress={saveVisit} loading={isSaving} />
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