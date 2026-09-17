import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppInput from "../../../components/ui/AppInput";
import LocalPartyPicker from "../../../components/forms/LocalPartyPicker";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import { VEHICLE_TYPE_OPTIONS } from "../../../constants/vehicleTypes";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import AppCard from "../../../components/ui/AppCard";
import AppMultiSelect from "../../../components/ui/AppMultiSelect";
import { useAuthStore } from "../../auth/store/auth.store";
import { scheduleFollowUpReminder } from "../../follow-up/services/followUpNotification.service";
import { saveFarmerVisit } from "../services/farmerVisit.service";
import { FarmerVisitForm } from "../types/farmerVisit.types";
import { useMasters } from "../../master/hooks/useMasters";

const createEmptyForm = (): FarmerVisitForm => ({
  farmer_name: "",
  visit_date: dayjs().format("YYYY-MM-DD"),
  visit_time: dayjs().format("HH:mm"),
  location: "",
  vehicle_type: "",
  discussion: "",
  outcome: "",
  next_followup_date: dayjs().format("YYYY-MM-DD"),
  product_ids: [],
});

export default function FarmerVisitScreen() {
  const { employee } = useAuthStore();
  const { products, dealers } = useMasters();
  const [form, setForm] = useState(createEmptyForm);
  const [saving, setSaving] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const update = (patch: Partial<FarmerVisitForm>) => setForm((current) => ({ ...current, ...patch }));


  async function save() {
    if (!employee?.id || saving) return;
    if (!form.farmer_name.trim()) return Alert.alert("Validation", "Please select the farmer name.");
    if (!form.location.trim()) return Alert.alert("Validation", "Please enter the visit location.");
    if (!form.vehicle_type) return Alert.alert("Validation", "Please select the vehicle type.");
    if (!form.discussion.trim()) return Alert.alert("Validation", "Please enter the discussion.");
    if (!form.outcome.trim()) return Alert.alert("Validation", "Please enter the outcome.");

    setSaving(true);
    try {
      const result = await saveFarmerVisit(employee.id, form);
      if (result?.data?.id && form.next_followup_date) {
        if (!result?.isLocal) {
          await scheduleFollowUpReminder({ visitId: result.data.id, visitType: "Farmer", partyName: form.farmer_name, followUpDate: form.next_followup_date });
        }
      }
      Alert.alert("Success", result.isUpdate ? "Farmer Visit Updated Successfully" : "Farmer Visit Saved Successfully");
      setForm(createEmptyForm());
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Unable to save farmer visit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <ScreenHeader title="Farmer Visit" subtitle="Log a field visit with a farmer" />
      <Animated.View style={{ opacity, transform: [{ translateY }], gap: 16 }}>
        <AppCard>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>VISIT DETAILS</Text></View>
          <View style={styles.fields}>
            <LocalPartyPicker
              employeeId={employee?.id ?? ""}
              type="farmer"
              label="Farmer Name"
              masterData={dealers}
              labelField="dealer_name"
              value={form.farmer_name}
              onChange={(item) => {
                const local = String(item.id ?? "").startsWith("local-party:");
                update({ farmer_name: local ? item.id : (item.name ?? item.dealer_name ?? ""), farmer_is_local: local });
              }}
            />
            <AppDatePicker label="Visit Date" value={form.visit_date} onChange={(date) => update({ visit_date: date })} />
            <AppInput label="Visit Time" value={form.visit_time} onChangeText={(text) => update({ visit_time: text })} placeholder="HH:mm" />
            <AppInput label="Location" value={form.location} onChangeText={(text) => update({ location: text })} placeholder="Enter location" />
            <AppSearchDropdown
              label="Vehicle Type *"
              data={VEHICLE_TYPE_OPTIONS}
              labelField="label"
              valueField="id"
              value={form.vehicle_type}
              placeholder="Select vehicle type"
              onChange={(item) => update({ vehicle_type: item.id })}
            />
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>DISCUSSION & OUTCOME</Text></View>
          <View style={styles.fields}>
            <AppInput label="Discussion" value={form.discussion} onChangeText={(text) => update({ discussion: text })} placeholder="Enter discussion" multiline numberOfLines={4} />
            <AppMultiSelect
              label="Products Discussed"
              data={products}
              labelField="product_name"
              valueField="id"
              value={form.product_ids}
              onChange={(items) => update({ product_ids: items })}
            />
            <AppInput label="Outcome" value={form.outcome} onChangeText={(text) => update({ outcome: text })} placeholder="Enter outcome" multiline numberOfLines={4} />
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>FOLLOW-UP</Text></View>
          <View style={styles.fields}>
            <AppDatePicker label="Next Follow-up" value={form.next_followup_date} onChange={(date) => update({ next_followup_date: date })} />
          </View>
        </AppCard>

        <PrimaryButton title="Save Visit" onPress={save} loading={saving} disabled={saving} />
      </Animated.View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FA" },
  container: { padding: 20, paddingBottom: 220, gap: 16 },
  sectionHead: { marginBottom: 4, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#6B7280", letterSpacing: 0.6 },
  fields: { gap: 12, marginTop: 10 },
});
