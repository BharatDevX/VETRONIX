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

  const readyCount = rows.filter((row) => !!row.dealer_id).length;

  return (
    <ScrollView
      style={styles.screen}
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
        <View style={styles.statRow}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>ROWS</Text>
            <Text style={styles.statValue}>{rows.length}</Text>
            <View style={[styles.statAccent, { backgroundColor: "#2563EB" }]} />
          </View>

          <View style={styles.statTile}>
            <Text style={styles.statLabel}>READY TO SAVE</Text>
            <Text style={styles.statValue}>{readyCount}</Text>
            <View style={[styles.statAccent, { backgroundColor: "#1D9C6E" }]} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>PLANNED MEETINGS</Text>

            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{rows.length}</Text>
            </View>
          </View>

          <View style={styles.tableWrap}>
            <DealerPlanTable rows={rows} dealers={dealers} onChange={updateRow} onDelete={deleteRow} />
          </View>

          <Text style={styles.hint}>
            Rows without a selected dealer are skipped when saving.
          </Text>
        </View>

        <PrimaryButton title="+ Add Row" onPress={addRow} />

        <PrimaryButton title="Save All" onPress={saveAll} loading={isSavingAll || saving} disabled={isSavingAll || saving} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F5F7FA",
  },

  container: {
    padding: 20,
    paddingBottom: 44,
    gap: 16,
  },

  statRow: {
    flexDirection: "row",
    gap: 12,
  },

  statTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEF1F6",
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#0B1220",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  statLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "#8A8F98",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#101418",
    marginTop: 6,
  },

  statAccent: {
    height: 3,
    width: 28,
    borderRadius: 999,
    marginTop: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF1F6",
    padding: 14,
    shadowColor: "#0B1220",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.6,
  },

  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#EEF1F6",
  },

  countPillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6B7280",
  },

  tableWrap: {
    gap: 12,
  },

  hint: {
    marginTop: 12,
    fontSize: 11.5,
    color: "#8A8F98",
    fontWeight: "500",
    paddingHorizontal: 2,
  },
});
