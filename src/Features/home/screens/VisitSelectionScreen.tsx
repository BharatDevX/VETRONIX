import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stethoscope, Store, Sprout } from "lucide-react-native";
import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppRadioGroup from "../../../components/ui/AppRadioGroup";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import { Button as PaperButton } from "react-native-paper";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuthStore } from "../../auth/store/auth.store";
import { useMasters } from "../../master/hooks/useMasters";
import { getCurrentMonthDoctorVisits } from "../../doctor/services/doctorVisit.service";
import { getCurrentMonthDealerVisits } from "../../dealer/services/dealerVisit.service";
import { getCurrentMonthFarmerVisits } from "../../farmer/services/farmerVisit.service";
import {
  generateDoctorVisitsPdf,
  generateDealerVisitsPdf,
  generateFarmerVisitsPdf,
} from "../../../services/pdf/pdf.service";

type Props = NativeStackScreenProps<RootStackParamList, "Visit">;
type VisitType = "doctor" | "dealer" | "farmer";

export default function VisitSelectionScreen({ navigation }: Props) {
  const [visitType, setVisitType] = useState<VisitType>("doctor");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const employee = useAuthStore((state) => state.employee);
  const { doctors, dealers, products } = useMasters();

  function continueToVisit() {
    navigation.navigate(
      visitType === "doctor" ? "DoctorVisit" : visitType === "dealer" ? "DealerVisit" : "FarmerVisit"
    );
  }

  async function generatePdf() {
    if (!employee?.id || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const monthLabel = dayjs().format("MMMM YYYY");
      const productMap = new Map(products.map((item: any) => [item.id, item.product_name ?? ""]));

      if (visitType === "doctor") {
        const records = await getCurrentMonthDoctorVisits(employee.id);
        const doctorMap = new Map(doctors.map((item: any) => [item.id, item.doctor_name ?? ""]));
        await generateDoctorVisitsPdf({
          employeeName: employee.full_name ?? "",
          monthLabel,
          records: records.map((record: any) => ({
            employeeName: employee.full_name ?? "",
            partyLabel: "Doctor",
            partyName: doctorMap.get(record.doctor_id) ?? record.doctor_name ?? record.party_name ?? "Unknown Doctor",
            visitDate: record.visit_date ?? "",
            visitTime: record.visit_time ?? "",
            location: record.location ?? "",
            discussion: record.discussion ?? "",
            outcome: record.outcome ?? "",
            products: (record.product_ids ?? []).map((id: string) => productMap.get(id) ?? id),
            nextFollowupDate: record.next_followup_date ?? "",
            remarks: record.remarks ?? "",
          })),
        });
      } else if (visitType === "dealer") {
        const records = await getCurrentMonthDealerVisits(employee.id);
        const dealerMap = new Map(dealers.map((item: any) => [item.id, item.dealer_name ?? ""]));
        await generateDealerVisitsPdf({
          employeeName: employee.full_name ?? "",
          monthLabel,
          records: records.map((record: any) => ({
            employeeName: employee.full_name ?? "",
            partyLabel: "Dealer",
            partyName: dealerMap.get(record.dealer_id) ?? record.dealer_name ?? record.party_name ?? "Unknown Dealer",
            visitDate: record.visit_date ?? "",
            visitTime: record.visit_time ?? "",
            location: record.location ?? "",
            discussion: record.discussion ?? "",
            outcome: record.outcome ?? "",
            products: (record.product_ids ?? []).map((id: string) => productMap.get(id) ?? id),
            nextFollowupDate: record.next_followup_date ?? "",
          })),
        });
      } else {
        const records = await getCurrentMonthFarmerVisits(employee.id);
        await generateFarmerVisitsPdf({
          employeeName: employee.full_name ?? "",
          monthLabel,
          records: records.map((record: any) => ({
            employeeName: employee.full_name ?? "",
            partyLabel: "Farmer",
            partyName: record.farmer_name ?? "Unknown Farmer",
            visitDate: record.visit_date ?? "",
            visitTime: record.visit_time ?? "",
            location: record.location ?? "",
            discussion: record.discussion ?? "",
            outcome: record.outcome ?? "",
            products: (record.product_ids ?? []).map((id: string) => productMap.get(id) ?? id),
            nextFollowupDate: record.next_followup_date ?? "",
          })),
        });
      }
    } catch (error) {
      Alert.alert("PDF Error", error instanceof Error ? error.message : "Unable to generate the visit PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  const selectedLabel =
    visitType === "doctor" ? "Doctor Visit" : visitType === "dealer" ? "Dealer Visit" : "Farmer Visit";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Daily Progress" subtitle="Choose the type of visit you want to record" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Visit Type</Text>
        <Text style={styles.cardSubtitle}>Select one option and continue with the existing visit form.</Text>

        <AppRadioGroup
          options={[
            { label: "Doctor Visit", value: "doctor" },
            { label: "Dealer Visit", value: "dealer" },
            { label: "Farmer Visit", value: "farmer" },
          ]}
          value={visitType}
          onChange={(value) => setVisitType(value as VisitType)}
        />
      </View>

      <View style={styles.previewCard}>
        <View style={styles.iconShell}>
          {visitType === "doctor" ? (
            <Stethoscope size={24} color="#2563EB" strokeWidth={2.2} />
          ) : visitType === "dealer" ? (
            <Store size={24} color="#2563EB" strokeWidth={2.2} />
          ) : (
            <Sprout size={24} color="#2563EB" strokeWidth={2.2} />
          )}
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewTitle}>{selectedLabel}</Text>
          <Text style={styles.previewSubtitle}>Your existing {visitType} visit form will open next.</Text>
        </View>
      </View>

      <PrimaryButton title="Continue" onPress={continueToVisit} />
      <PaperButton
        mode="outlined"
        icon="file-pdf-box"
        onPress={generatePdf}
        loading={generatingPdf}
        disabled={generatingPdf}
        style={styles.pdfButton}
      >
        Generate PDF
      </PaperButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FA" },
  container: { padding: 20, paddingBottom: 44, gap: 16 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#EEF1F6",
    padding: 16, shadowColor: "#0B1220", shadowOpacity: 0.05, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#101418" },
  cardSubtitle: { marginTop: 4, fontSize: 12.5, color: "#8A8F98", lineHeight: 18 },
  previewCard: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF",
    borderRadius: 18, borderWidth: 1, borderColor: "#DCEAF8", padding: 16,
  },
  iconShell: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F3FF" },
  previewText: { flex: 1 },
  previewTitle: { fontSize: 15, fontWeight: "800", color: "#101418" },
  previewSubtitle: { marginTop: 3, fontSize: 12, color: "#8A8F98" },
  pdfButton: { minHeight: 50, borderRadius: 14, borderColor: "#C9DDF1", backgroundColor: "#FFFFFF" },
});
