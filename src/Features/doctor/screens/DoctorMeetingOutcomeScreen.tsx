import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Alert, StyleSheet, View, Text, Animated, Easing } from "react-native";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AppCard from "../../../components/ui/AppCard";

import OutcomeTable from "../components/OutcomeTable";

import { useMasters } from "../../master/hooks/useMasters";
import { useDoctorOutcome } from "../hooks/useDoctorOutcome";
import { useDoctorPlan } from "../hooks/useDoctorPlan";
import { useAuthStore } from "../../auth/store/auth.store";

const emptyRow = {
  doctor_id: "",
  area: "",
  agreed_percentage: 0,
  product_ids: [],
};

export default function DoctorMeetingOutcomeScreen() {
  const { employee } = useAuthStore();

  const { doctors, products } = useMasters();

  const { save } = useDoctorOutcome(employee?.id ?? "");

  const { plans } = useDoctorPlan(employee?.id ?? "");

  const [rows, setRows] = useState([emptyRow]);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
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

  function updateRow(index: number, field: string, value: any) {
    const copy = [...rows];

    copy[index] = {
      ...copy[index],
      [field]: value,
    };

    setRows(copy);
  }

  function addRow() {
    setRows([...rows, { ...emptyRow }]);
  }

  function deleteRow(index: number) {
    const copy = [...rows];

    copy.splice(index, 1);

    setRows(copy);
  }

  async function saveAll() {
    if (rows.length === 0) return;

    setIsSavingAll(true);

    try {
      let updatedCount = 0;

      for (const row of rows) {
        if (!row.doctor_id) continue;
        const result = await save(row);
        if (result?.isUpdate) updatedCount += 1;
      }

      Alert.alert("Success", updatedCount > 0 ? "Doctor Meeting Outcome Updated" : "Doctor Meeting Outcome Saved");
    } catch {
      Alert.alert("Error", "Unable to save outcome.");
    } finally {
      setIsSavingAll(false);
    }
  }

  function importFromPlan() {
    const imported = plans.map((plan: any) => ({
      doctor_id: plan.doctor_id,
      area: plan.location,
      agreed_percentage: plan.agreed_percentage,
      product_ids: [],
    }));

    if (imported.length > 0) {
      setRows(imported);
    } else {
      Alert.alert("No Plans", "No Doctor Meeting Plan found for this month.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Doctor Meeting Outcome"
        subtitle="Record what was agreed in each meeting"
      />

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
          gap: 16,
        }}
      >
        <AppCard>
          <Text style={styles.cardTitle}>Quick Import</Text>
          <Text style={styles.cardSubtitle}>
            Pull rows from this month's Doctor Meeting Plan
          </Text>

          <View style={{ marginTop: 12 }}>
            <PrimaryButton title="📥 Import From Doctor Plan" onPress={importFromPlan} />
          </View>
        </AppCard>

        <View>
          <Text style={styles.sectionLabel}>Meeting Outcomes</Text>

          <OutcomeTable
            rows={rows}
            doctors={doctors}
            products={products}
            onChange={updateRow}
            onDelete={deleteRow}
          />
        </View>

        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title="+ Add Row" onPress={addRow} />
          </View>
        </View>

        <PrimaryButton title="Save All" onPress={saveAll} loading={isSavingAll} />
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
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#8A8F98",
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 2,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
});