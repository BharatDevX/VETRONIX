import React, { useState } from "react";
import { Alert } from "react-native";
import dayjs from "dayjs";
import { Button as PaperButton } from "react-native-paper";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ClipboardList, SquarePen } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppRadioGroup from "../../../components/ui/AppRadioGroup";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { useAuthStore } from "../../auth/store/auth.store";
import { useMasters } from "../../master/hooks/useMasters";
import { supabase } from "../../../services/supabase/supabase";
import { generateMonthlyMeetingPlanPdf } from "../../../services/pdf/pdf.service";

type Props = NativeStackScreenProps<RootStackParamList, "MeetingPlan">;
type MeetingPlanType = "doctor" | "dealer" | "farmer";

export default function MeetingPlanSelectionScreen({ navigation }: Props) {
  const [planType, setPlanType] = useState<MeetingPlanType>("doctor");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const employee = useAuthStore((state) => state.employee);
  const { doctors, dealers } = useMasters();

  async function generatePdf() {
    if (!employee?.id || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const month = dayjs().month() + 1;
      const year = dayjs().year();
      let records: any[] = [];

      if (planType === "doctor") {
        const { data, error } = await supabase.from("doctor_meeting_plans").select("*").eq("employee_id", employee.id).eq("month", month).eq("year", year).order("planned_date");
        if (error) throw error;
        const map = new Map(doctors.map((d: any) => [d.id, d.doctor_name ?? ""]));
        records = (data ?? []).map((r: any) => ({ type: "Doctor", partyName: map.get(r.doctor_id) ?? "Unknown Doctor", location: r.location ?? "", plannedDate: r.planned_date ?? "", meetingDate: r.meeting_date ?? "", discussion: r.discussion ?? "", reply: r.reply ?? "", note: "" }));
      } else if (planType === "dealer") {
        const { data, error } = await supabase.from("dealer_meeting_plans").select("*").eq("employee_id", employee.id).eq("month", month).eq("year", year).order("planned_date");
        if (error) throw error;
        const map = new Map(dealers.map((d: any) => [d.id, d.dealer_name ?? ""]));
        records = (data ?? []).map((r: any) => ({ type: "Dealer", partyName: map.get(r.dealer_id) ?? "Unknown Dealer", location: r.location ?? "", plannedDate: r.planned_date ?? "", meetingDate: r.meeting_date ?? "", discussion: r.discussion ?? "", reply: "", note: "" }));
      } else {
        const { data, error } = await supabase.from("farmer_meeting_plans").select("*").eq("employee_id", employee.id).eq("month", month).eq("year", year).order("planned_date");
        if (error) throw error;
        records = (data ?? []).map((r: any) => ({ type: "Farmer", partyName: r.farmer_name ?? "", location: r.location ?? "", plannedDate: r.planned_date ?? "", meetingDate: r.meeting_date ?? "", discussion: "", reply: "", note: r.note ?? "" }));
      }

      await generateMonthlyMeetingPlanPdf({
        employeeName: employee.full_name ?? "",
        monthLabel: dayjs().format("MMMM YYYY"),
        records,
      });
    } catch (error) {
      Alert.alert("PDF Error", error instanceof Error ? error.message : "Unable to generate the monthly meeting plan PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  function continueToPlan() {
    if (planType === "doctor") navigation.navigate("DoctorMeetingPlan");
    else if (planType === "dealer") navigation.navigate("DealerMeetingPlan");
    else navigation.navigate("FarmerMeetingPlan");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Monthly Meeting Plan" subtitle="Choose the type of monthly meeting plan you want to create" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meeting Plan Type</Text>
        <Text style={styles.cardSubtitle}>Select one option and continue with the existing meeting-plan form.</Text>

        <AppRadioGroup
          options={[
            { label: "Doctor Meeting Plan", value: "doctor" },
            { label: "Dealer Meeting Plan", value: "dealer" },
            { label: "Farmer Meeting Plan", value: "farmer" },
          ]}
          value={planType}
          onChange={(value) => setPlanType(value as MeetingPlanType)}
        />
      </View>

      <View style={styles.previewCard}>
        <View style={styles.iconShell}>
          {planType === "doctor" ? (
            <ClipboardList size={24} color="#2563EB" strokeWidth={2.2} />
          ) : (
            <SquarePen size={24} color="#2563EB" strokeWidth={2.2} />
          )}
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewTitle}>
            {planType === "doctor" ? "Doctor Meeting Plan" : planType === "dealer" ? "Dealer Meeting Plan" : "Farmer Meeting Plan"}
          </Text>
          <Text style={styles.previewSubtitle}>
            Your {planType} meeting-plan form will open next.
          </Text>
        </View>
      </View>

      <PrimaryButton title="Continue" onPress={continueToPlan} />
      <PaperButton mode="outlined" icon="file-pdf-box" onPress={generatePdf} loading={generatingPdf} disabled={generatingPdf} style={styles.pdfButton}>Generate PDF</PaperButton>
      <Pressable style={styles.historyButton} onPress={() => navigation.navigate("MonthlyMeetingPlanHistory")}>
        <Text style={styles.historyButtonText}>View My Monthly Meeting Plans</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FA" },
  container: { padding: 20, paddingBottom: 44, gap: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF1F6",
    padding: 16,
    shadowColor: "#0B1220",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#101418" },
  cardSubtitle: { marginTop: 4, fontSize: 12.5, color: "#8A8F98", lineHeight: 18 },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCEAF8",
    padding: 16,
  },
  iconShell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F3FF",
  },
  previewText: { flex: 1 },
  historyButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#C9DDF1", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  historyButtonText: { fontSize: 14, fontWeight: "800", color: "#2563EB" },
  previewTitle: { fontSize: 15, fontWeight: "800", color: "#101418" },
  previewSubtitle: { marginTop: 3, fontSize: 12, color: "#8A8F98" },
  pdfButton: { minHeight: 50, borderRadius: 14, borderColor: "#C9DDF1", backgroundColor: "#FFFFFF" },
});
