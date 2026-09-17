import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppCard from "../../../components/ui/AppCard";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import SaleLineItemsEditor from "../components/SaleLineItemsEditor";
import { useMasters } from "../../master/hooks/useMasters";
import { useAuthStore } from "../../auth/store/auth.store";
import { saveCounterSale } from "../services/fieldSales.service";
import type { SaleLineItem } from "../types/fieldSales.types";

const makeLine = (): SaleLineItem => ({ id: `${Date.now()}-${Math.random()}`, product_id: "", pack_size: "", box_count: 0, quantity: 1, rate: 0 });

export default function CounterSaleEntryScreen() {
  const { employee } = useAuthStore();
  const { dealers, products } = useMasters();
  const [dealerId, setDealerId] = useState("");
  const [saleDate, setSaleDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [lines, setLines] = useState<SaleLineItem[]>([makeLine()]);
  const [saving, setSaving] = useState(false);
  const total = useMemo(() => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.rate || 0), 0), [lines]);

  async function submit() {
    if (!employee?.id) return Alert.alert("Error", "Employee session is missing.");
    if (!dealerId) return Alert.alert("Validation", "Please select a dealer.");
    if (!lines.every((line) => line.product_id && line.quantity > 0 && line.rate > 0)) return Alert.alert("Validation", "Please complete every medicine row.");
    setSaving(true);
    try {
      await saveCounterSale(employee.id, { dealer_id: dealerId, sale_date: saleDate, lines });
      Alert.alert("Success", "Counter sale saved successfully.");
      setDealerId(""); setSaleDate(dayjs().format("YYYY-MM-DD")); setLines([makeLine()]);
    } catch (error) {
      console.error("COUNTER SALE SUPABASE ERROR:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Unable to save the counter sale right now.");
    } finally { setSaving(false); }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Counter Sale" subtitle="Record a counter sale" />
      <AppCard>
        <Text style={styles.title}>Sale Details</Text>
        <Text style={styles.subtitle}>Select the dealer, date and medicines sold.</Text>
        <View style={styles.fields}>
          <AppSearchDropdown label="Dealer" data={dealers} labelField="dealer_name" valueField="id" value={dealerId} onChange={(item) => setDealerId(item.id)} />
          <AppDatePicker label="Sale Date" value={saleDate} onChange={setSaleDate} />
        </View>
      </AppCard>
      <SaleLineItemsEditor products={products as any[]} lines={lines} onChange={setLines} showPackSize manualQuantity />
      <View style={styles.totalCard}><Text style={styles.totalLabel}>Counter Sale Total</Text><Text style={styles.totalValue}>₹{total.toFixed(2)}</Text></View>
      <PrimaryButton title="Save Counter Sale" onPress={submit} loading={saving} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F8FC" }, container: { padding: 20, paddingBottom: 44, gap: 16 },
  title: { fontSize: 17, fontWeight: "800", color: "#16324F" }, subtitle: { marginTop: 4, fontSize: 12, color: "#8697A8" }, fields: { marginTop: 16 },
  totalCard: { backgroundColor: "#EAF5FC", borderRadius: 18, padding: 17, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#4C6379" }, totalValue: { fontSize: 22, fontWeight: "900", color: "#0F76AE" },
});
