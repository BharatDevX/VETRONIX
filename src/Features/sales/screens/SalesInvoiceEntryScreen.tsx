import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppCard from "../../../components/ui/AppCard";
import AppInput from "../../../components/ui/AppInput";
import { useAuthStore } from "../../auth/store/auth.store";
import { getEmployeeActualSales, type ActualSalesReportRow } from "../services/actualSales.service";

export default function SalesInvoiceEntryScreen() {
  const { employee } = useAuthStore();
  const [rows, setRows] = useState<ActualSalesReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!employee?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setRows(await getEmployeeActualSales(employee.id));
    } catch (error) {
      console.error("ACTUAL SALES REPORT ERROR:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [employee?.id]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const total = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Sales" subtitle="View sales recorded by the administrator" />

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>TOTAL SALES</Text>
          <Text style={styles.summaryValue}>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countValue}>{rows.length}</Text>
          <Text style={styles.countLabel}>Line items</Text>
        </View>
      </View>

      <AppInput label="Employee" value={employee?.full_name ?? ""} editable={false} />
      <AppInput label="Employee ID" value={employee?.employee_id ?? ""} editable={false} />

      {loading ? (
        <AppCard><Text style={styles.empty}>Loading sales...</Text></AppCard>
      ) : rows.length === 0 ? (
        <AppCard><Text style={styles.empty}>No sales have been recorded for you yet.</Text></AppCard>
      ) : rows.map((row) => (
        <AppCard key={row.id}>
          <View style={styles.rowTop}>
            <Text style={styles.dealer}>{row.dealer_name || "Dealer"}</Text>
            <Text style={styles.date}>{dayjs(row.sale_date).format("DD MMM YYYY")}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Invoice: {row.invoice_no || "-"}</Text>
            <Text style={styles.meta}>HQ: {row.hq || "-"}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.product}>{row.product_name}</Text>
          <View style={styles.grid}>
            <Metric label="Pack Size" value={row.pack_size || "-"} />
            <Metric label="Box" value={String(row.box_count)} />
            <Metric label="Quantity" value={String(row.quantity)} />
            <Metric label="Rate" value={`₹${row.rate.toFixed(2)}`} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amount}>₹{row.amount.toFixed(2)}</Text>
          </View>
        </AppCard>
      ))}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F8FC" },
  container: { padding: 20, paddingBottom: 48, gap: 16 },
  summaryCard: { backgroundColor: "#0F76AE", borderRadius: 22, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 10, fontWeight: "800", color: "#BFDFFA", letterSpacing: 1 },
  summaryValue: { marginTop: 5, fontSize: 25, fontWeight: "900", color: "#FFFFFF" },
  countPill: { minWidth: 86, borderRadius: 15, paddingVertical: 10, alignItems: "center", backgroundColor: "rgba(255,255,255,0.14)" },
  countValue: { fontSize: 19, fontWeight: "900", color: "#FFFFFF" },
  countLabel: { marginTop: 2, fontSize: 10, color: "#D8ECFA" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  dealer: { flex: 1, fontSize: 16, fontWeight: "900", color: "#16324F" },
  date: { fontSize: 12, color: "#73869A", fontWeight: "700" },
  metaRow: { marginTop: 7, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  meta: { flex: 1, fontSize: 11, color: "#7C8C9C" },
  divider: { height: 1, backgroundColor: "#E8EEF4", marginVertical: 12 },
  product: { fontSize: 15, fontWeight: "800", color: "#243B53", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { minWidth: "46%" as any, flex: 1, backgroundColor: "#F7FAFC", borderRadius: 10, padding: 10 },
  metricLabel: { fontSize: 10, color: "#8796A5", fontWeight: "700" },
  metricValue: { marginTop: 3, fontSize: 13, color: "#243B53", fontWeight: "800" },
  amountRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amountLabel: { fontSize: 12, fontWeight: "700", color: "#718096" },
  amount: { fontSize: 18, fontWeight: "900", color: "#0F76AE" },
  empty: { textAlign: "center", paddingVertical: 20, color: "#7B8B9B" },
});
