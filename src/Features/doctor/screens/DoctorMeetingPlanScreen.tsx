import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Alert, View, Text, Animated, Easing } from "react-native";

import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import PrimaryButton from "../../../components/ui/PrimaryButton";

import PlanTable from "../components/PlanTable";

import { useMasters } from "../../master/hooks/useMasters";
import { useDoctorPlan } from "../hooks/useDoctorPlan";
import { useAuthStore } from "../../auth/store/auth.store";

const emptyRow = {
  doctor_id: "",
  location: "",
  planned_date: dayjs().format("YYYY-MM-DD"),
  meeting_date: dayjs().format("YYYY-MM-DD"),
  discussion: "",
  agreed_percentage: 0,
  product_ids: [],
};

export default function DoctorMeetingPlanScreen() {
  const { employee } = useAuthStore();

  const { doctors, products } = useMasters();

  const { savePlan } = useDoctorPlan(employee?.id ?? "");

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
        const result = await savePlan(row);
        if (result?.isUpdate) updatedCount += 1;
      }

      Alert.alert(
        "Success",
        updatedCount > 0 ? "Doctor Meeting Plan Updated" : "Doctor Meeting Plan Saved"
      );
    } catch (e) {
      Alert.alert("Error", "Unable to save plans.");
    } finally {
      setIsSavingAll(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Doctor Meeting Plan"
        subtitle="Plan upcoming doctor meetings for this month"
      />

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
          gap: 16,
        }}
      >
        <View>
          <Text style={styles.sectionLabel}>Planned Meetings</Text>

          <PlanTable
            rows={rows}
            doctors={doctors}
            products={products}
            onChange={updateRow}
            onDelete={deleteRow}
          />
        </View>

        <PrimaryButton title="+ Add Row" onPress={addRow} />

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

  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 2,
  },
});