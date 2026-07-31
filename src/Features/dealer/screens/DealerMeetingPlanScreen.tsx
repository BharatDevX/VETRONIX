import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Alert, StyleSheet, View, Text, Animated, Easing } from "react-native";

import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import PrimaryButton from "../../../components/ui/PrimaryButton";

import DealerPlanTable from "../components/DealerPlanTable";

import { useMasters } from "../../master/hooks/useMasters";
import { useDealerPlan } from "../hooks/useDealerPlan";
import { useAuthStore } from "../../auth/store/auth.store";

const emptyRow = {
  dealer_id: "",
  location: "",
  planned_date: dayjs().format("YYYY-MM-DD"),
  meeting_date: dayjs().format("YYYY-MM-DD"),
  discussion: "",
};

export default function DealerMeetingPlanScreen() {
  const { employee } = useAuthStore();
  const { dealers } = useMasters();
  const { savePlan, saving } = useDealerPlan(employee?.id ?? "");

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
    if (rows.length === 0 || isSavingAll || saving) {
      return;
    }

    setIsSavingAll(true);

    try {
      let updatedCount = 0;

      for (const row of rows) {
        if (!row.dealer_id) continue;
        const result = await savePlan(row);
        if (result?.isUpdate) updatedCount += 1;
      }

      Alert.alert("Success", updatedCount > 0 ? "Existing record updated successfully." : "Saved successfully.");
    } catch {
      Alert.alert("Error", "Unable to save the dealer plan right now.");
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
        title="Dealer Meeting Plan"
        subtitle="Plan upcoming dealer meetings"
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

          <DealerPlanTable rows={rows} dealers={dealers} onChange={updateRow} onDelete={deleteRow} />
        </View>

        <PrimaryButton title="+ Add Row" onPress={addRow} />

        <PrimaryButton title="Save All" onPress={saveAll} loading={isSavingAll || saving} disabled={isSavingAll || saving} />
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