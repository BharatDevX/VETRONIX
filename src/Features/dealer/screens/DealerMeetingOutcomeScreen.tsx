import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Alert, StyleSheet, View, Text, Animated, Easing } from "react-native";

import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppInput from "../../../components/ui/AppInput";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import AppCard from "../../../components/ui/AppCard";

import { useMasters } from "../../master/hooks/useMasters";
import { useDealerOutcome } from "../hooks/useDealerOutcome";
import { useDealerPlan } from "../hooks/useDealerPlan";
import { useDealerVisit } from "../hooks/useDealerVisit";
import { useAuthStore } from "../../auth/store/auth.store";

type DealerOutcomeForm = {
  dealer_id: string;
  location: string;
  meeting_date: string;
  outcome: string;
};

const initialForm = (): DealerOutcomeForm => ({
  dealer_id: "",
  location: "",
  meeting_date: dayjs().format("YYYY-MM-DD"),
  outcome: "",
});

export default function DealerMeetingOutcomeScreen() {
  const { employee } = useAuthStore();
  const { dealers } = useMasters();
  const { save, saving } = useDealerOutcome(employee?.id ?? "");
  const { plans } = useDealerPlan(employee?.id ?? "");
  const { visits } = useDealerVisit(employee?.id ?? "");

  const [form, setForm] = useState<DealerOutcomeForm>(initialForm);

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

  function importFromPlan() {
    if (plans.length === 0) {
      Alert.alert("No Plan", "No Dealer Meeting Plan found.");
      return;
    }

    const latest = plans[0];

    setForm({
      dealer_id: latest.dealer_id,
      location: latest.location,
      meeting_date: latest.meeting_date,
      outcome: "",
    });
  }

  function importLatestVisit() {
    if (visits.length === 0) {
      Alert.alert("No Visit", "No Dealer Visit found.");
      return;
    }

    const latest = visits[0];

    setForm({
      dealer_id: latest.dealer_id,
      location: latest.location,
      meeting_date: latest.visit_date,
      outcome: latest.outcome,
    });
  }

  async function saveOutcome() {
    if (!form.dealer_id || saving) return;

    try {
      const result = await save(form);
      Alert.alert("Success", result?.isUpdate ? "Existing record updated successfully." : "Saved successfully.");
      setForm(initialForm());
    } catch {
      Alert.alert("Error", "Unable to save the dealer outcome right now.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Dealer Meeting Outcome"
        subtitle="Record what came out of a dealer meeting"
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
            Pull details from an existing plan or visit
          </Text>

          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Import From Plan" onPress={importFromPlan} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Import Latest Visit" onPress={importLatestVisit} />
            </View>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Meeting Outcome</Text>

          <View style={styles.fieldGroup}>
            <AppSearchDropdown
              label="Dealer"
              data={dealers}
              labelField="dealer_name"
              valueField="id"
              value={form.dealer_id}
              onChange={(item) => setForm({ ...form, dealer_id: item.id })}
            />

            <AppInput
              label="Location"
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              placeholder={""}
            />

            <AppDatePicker
              label="Meeting Date"
              value={form.meeting_date}
              onChange={(date) => setForm({ ...form, meeting_date: date })}
            />

            <AppInput
              label="Outcome"
              multiline
              value={form.outcome}
              onChangeText={(text) => setForm({ ...form, outcome: text })}
              placeholder={""}
            />
          </View>
        </AppCard>

        <PrimaryButton title="Save Outcome" onPress={saveOutcome} loading={saving} disabled={saving} />
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

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  fieldGroup: {
    gap: 12,
    marginTop: 8,
  },
});