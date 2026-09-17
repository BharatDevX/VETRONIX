import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppCard from "../../../components/ui/AppCard";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import SaleLineItemsEditor from "../components/SaleLineItemsEditor";
import { useMasters } from "../../master/hooks/useMasters";
import { useAuthStore } from "../../auth/store/auth.store";
import { hasSubmittedSecondarySales, saveSecondarySale, isSecondarySalesDay } from "../services/secondarySales.service";
import type { SaleLineItem } from "../types/fieldSales.types";

function makeLine(): SaleLineItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    product_id: "",
    pack_size: "",
    box_count: 0,
    quantity: 0,
    rate: 0,
  };
}

export default function SecondarySalesEntryScreen() {
  const { employee } = useAuthStore();
  const { dealers, products } = useMasters();
  const [dealerId, setDealerId] = useState("");
  const [lines, setLines] = useState<SaleLineItem[]>([makeLine()]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const saleDate = dayjs().format("YYYY-MM-DD");
  const isSaturday = isSecondarySalesDay(dayjs());

  useEffect(() => {
    let active = true;

    async function checkSubmission() {
      if (!employee?.id) {
        if (active) {
          setSubmitted(false);
          setCheckingSubmission(false);
        }
        return;
      }

      setCheckingSubmission(true);
      try {
        const value = await hasSubmittedSecondarySales(employee.id);
        if (active) setSubmitted(value);
      } catch (error) {
        console.error("Failed to check Secondary Sales submission:", error);
        if (active) setSubmitted(false);
      } finally {
        if (active) setCheckingSubmission(false);
      }
    }

    void checkSubmission();
    return () => { active = false; };
  }, [employee?.id]);

  const formOpen = !submitted;

  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + Number(line.quantity || 0) * Number(line.rate || 0),
        0,
      ),
    [lines],
  );

  async function submit() {
    if (!employee?.id) {
      Alert.alert("Error", "Employee session is missing.");
      return;
    }

    if (submitted) {
      Alert.alert(
        "Secondary Sales",
        "You have already submitted Secondary Sales for this week. The form will open again on Saturday.",
      );
      return;
    }

    if (!dealerId) {
      Alert.alert("Validation", "Please select a dealer.");
      return;
    }

    if (
      !lines.length ||
      !lines.every(
        (line) =>
          line.product_id &&
          Number(line.quantity) > 0 &&
          Number(line.rate) > 0,
      )
    ) {
      Alert.alert(
        "Validation",
        "Please complete quantity and rate for every selected medicine.",
      );
      return;
    }

    setSaving(true);
    try {
      await saveSecondarySale(employee.id, {
        dealer_id: dealerId,
        sale_date: saleDate,
        lines,
      });

      Alert.alert(
        "Success",
        "Secondary Sales submitted successfully for this Saturday.",
      );
      setDealerId("");
      setLines([makeLine()]);
      setSubmitted(true);
    } catch (error) {
      console.error("SECONDARY SALES SUPABASE ERROR:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to save Secondary Sales right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Secondary Sales"
        subtitle="Weekly secondary sales submission"
      />

      <AppCard>
        <Text style={styles.title}>Weekly Secondary Sales</Text>
        <Text style={styles.subtitle}>
          This form is available once every week on Saturday and follows the
          same structure as Counter Sale.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Submission day</Text>
          <Text style={[styles.statusValue, !isSaturday && styles.closed]}>
            {checkingSubmission
              ? "Checking submission status…"
              : submitted
                ? "Submitted — Opens again Saturday"
                : isSaturday
                  ? "Saturday — Open"
                  : "Catch-up — Open until submission"}
          </Text>
        </View>

        <View style={styles.fields}>
          <AppSearchDropdown
            label="Dealer"
            data={dealers}
            labelField="dealer_name"
            valueField="id"
            value={dealerId}
            onChange={(item) => setDealerId(item.id)}
          />

          <AppDatePicker
            label="Sale Date"
            value={saleDate}
            onChange={() => undefined}
          />
        </View>
      </AppCard>

      <SaleLineItemsEditor
        products={products as any[]}
        lines={lines}
        onChange={setLines}
        showPackSize
        manualQuantity
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Secondary Sale Total</Text>
        <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
      </View>

      <PrimaryButton
        title={
          submitted
            ? "Submitted for This Week"
            : isSaturday
              ? "Submit Secondary Sales"
              : "Submit Missed Secondary Sales"
        }
        onPress={submit}
        loading={saving}
        disabled={saving || checkingSubmission || submitted}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F8FC" },
  container: { padding: 20, paddingBottom: 44, gap: 16 },
  title: { fontSize: 17, fontWeight: "800", color: "#16324F" },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#8697A8",
  },
  statusCard: {
    marginTop: 16,
    borderRadius: 14,
    padding: 13,
    backgroundColor: "#F4F8FC",
    borderWidth: 1,
    borderColor: "#E3EAF1",
  },
  statusLabel: { fontSize: 11, fontWeight: "700", color: "#8697A8" },
  statusValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: "#1D9C6E",
  },
  closed: { color: "#C25A4A" },
  fields: { marginTop: 16 },
  totalCard: {
    backgroundColor: "#EAF5FC",
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#4C6379" },
  totalValue: { fontSize: 22, fontWeight: "900", color: "#0F76AE" },
});
