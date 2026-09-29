import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { FileText, Package, UserRound } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppCard from "../../../components/ui/AppCard";
import { useAuthStore } from "../../auth/store/auth.store";
import { getEmployeeOrderForms, type EmployeeOrderForm } from "../services/orderForm.service";
import { generateEmployeeOrderFormPdf } from "../../../services/pdf/pdf.service";

const money = (value: number) => `₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function saleTypeLabel(type: EmployeeOrderForm["saleType"]) {
  if (type === "farmer") return "Farmer Sale";
  if (type === "retailer") return "Retailer Sale";
  return "Dealer Sale";
}

function partyLabel(order: EmployeeOrderForm) {
  if (order.saleType === "farmer") return order.farmerName || "Farmer";
  if (order.saleType === "retailer") return order.retailerName || "Retailer";
  return order.dealerName || "Dealer";
}

export default function OrderFormHistoryScreen() {
  const employee = useAuthStore((state) => state.employee);
  const [orders, setOrders] = useState<EmployeeOrderForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingOrderId, setGeneratingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employee?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      setOrders(await getEmployeeOrderForms(employee.id));
    } catch (err) {
      console.error("ORDER FORM HISTORY ERROR:", err);
      setError(err instanceof Error ? err.message : "Unable to load your order forms.");
    } finally {
      setLoading(false);
    }
  }, [employee?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function generatePdf(order: EmployeeOrderForm) {
    if (!employee?.id || generatingOrderId) return;

    setGeneratingOrderId(order.orderNumber);
    try {
      await generateEmployeeOrderFormPdf({
        employeeName: employee.full_name ?? "",
        order,
      });
    } catch (err) {
      Alert.alert("PDF Error", err instanceof Error ? err.message : "Unable to generate the order form PDF.");
    } finally {
      setGeneratingOrderId(null);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ScreenHeader title="My Order Forms" subtitle="View order forms created by you" />

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>MY ORDER FORMS</Text>
            <Text style={styles.summaryValue}>{orders.length}</Text>
          </View>
          <View style={styles.summaryPill}>
            <Package size={18} color="#FFFFFF" />
            <Text style={styles.summaryPillText}>Created by you</Text>
          </View>
        </View>

        {loading && !orders.length ? <ActivityIndicator color="#0F76AE" style={styles.loader} /> : null}

        {error ? (
          <AppCard>
            <Text style={styles.error}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </AppCard>
        ) : null}

        {!loading && !error && !orders.length ? (
          <AppCard>
            <View style={styles.emptyIcon}><FileText size={24} color="#0F76AE" /></View>
            <Text style={styles.emptyTitle}>No order forms yet</Text>
            <Text style={styles.emptyText}>Order forms that you save will appear here.</Text>
          </AppCard>
        ) : null}

        {orders.map((order) => (
          <AppCard key={order.orderNumber}>
            <View style={styles.orderHeader}>
              <View style={styles.orderIcon}><FileText size={20} color="#0F76AE" /></View>
              <View style={styles.orderHeaderText}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderMeta}>{order.saleDate} • {saleTypeLabel(order.saleType)}</Text>
              </View>
              <Text style={styles.orderTotal}>{money(order.totalAmount)}</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{order.saleType === "farmer" ? "Farmer" : order.saleType === "retailer" ? "Retailer" : "Dealer"}</Text>
                <View style={styles.partyRow}>
                  <UserRound size={14} color="#718096" />
                  <Text style={styles.infoValue} numberOfLines={2}>{partyLabel(order)}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Head Quarter</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{order.hq || "-"}</Text>
              </View>
            </View>

            {order.saleType === "farmer" && order.dealerName ? (
              <View style={styles.optionalDealer}><Text style={styles.infoLabel}>Dealer</Text><Text style={styles.infoValue}>{order.dealerName}</Text></View>
            ) : null}

            <View style={styles.divider} />
            <Text style={styles.medicineTitle}>Medicines ({order.lines.length})</Text>
            {order.lines.map((line) => (
              <View key={line.id} style={styles.lineRow}>
                <View style={styles.lineMain}>
                  <Text style={styles.productName} numberOfLines={2}>{line.productName}</Text>
                  <Text style={styles.lineMeta}>Pack: {line.packSize || "-"} • Boxes: {line.boxCount} • Qty: {line.quantity}</Text>
                </View>
                <View style={styles.lineAmountWrap}>
                  <Text style={styles.lineAmount}>{money(line.amount)}</Text>
                  <Text style={styles.lineRate}>₹{line.rate.toLocaleString("en-IN", { maximumFractionDigits: 2 })} / unit</Text>
                </View>
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [styles.pdfButton, pressed && styles.pressed]}
              onPress={() => void generatePdf(order)}
              disabled={Boolean(generatingOrderId)}
            >
              {generatingOrderId === order.orderNumber ? <ActivityIndicator size="small" color="#0F76AE" /> : <FileText size={17} color="#0F76AE" />}
              <Text style={styles.pdfText}>{generatingOrderId === order.orderNumber ? "Generating PDF…" : "Generate PDF"}</Text>
            </Pressable>
          </AppCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F8FC" },
  container: { padding: 20, paddingBottom: 48, gap: 14 },
  summaryCard: { borderRadius: 22, padding: 18, backgroundColor: "#0F76AE", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: "#BFDFFA" },
  summaryValue: { marginTop: 3, fontSize: 30, fontWeight: "900", color: "#FFFFFF" },
  summaryPill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)" },
  summaryPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  loader: { marginTop: 28 },
  error: { color: "#B42318", fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: "#EAF5FC" },
  retryText: { color: "#0F76AE", fontWeight: "800", fontSize: 12 },
  emptyIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#EAF5FC", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  emptyTitle: { marginTop: 12, textAlign: "center", color: "#16324F", fontSize: 16, fontWeight: "800" },
  emptyText: { marginTop: 5, textAlign: "center", color: "#7C8A97", fontSize: 12.5 },
  orderHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#EAF5FC", alignItems: "center", justifyContent: "center" },
  orderHeaderText: { flex: 1 },
  orderNumber: { fontSize: 16, fontWeight: "900", color: "#16324F" },
  orderMeta: { marginTop: 3, fontSize: 11.5, color: "#7C8A97", fontWeight: "600" },
  orderTotal: { fontSize: 16, fontWeight: "900", color: "#0F76AE" },
  infoGrid: { flexDirection: "row", gap: 10, marginTop: 15 },
  infoItem: { flex: 1, backgroundColor: "#F7FAFC", borderRadius: 12, padding: 11 },
  infoLabel: { fontSize: 9.5, color: "#8997A5", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { marginTop: 4, flex: 1, color: "#243B53", fontSize: 12.5, fontWeight: "700" },
  partyRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  optionalDealer: { marginTop: 10, backgroundColor: "#F7FAFC", borderRadius: 12, padding: 11 },
  divider: { height: 1, backgroundColor: "#E8EEF4", marginVertical: 14 },
  medicineTitle: { color: "#16324F", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  lineRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EEF2F6" },
  lineMain: { flex: 1 },
  productName: { color: "#243B53", fontSize: 13, fontWeight: "800" },
  lineMeta: { marginTop: 4, color: "#7C8A97", fontSize: 10.5 },
  lineAmountWrap: { alignItems: "flex-end", minWidth: 84 },
  lineAmount: { color: "#243B53", fontSize: 13, fontWeight: "800" },
  lineRate: { marginTop: 3, color: "#8A97A5", fontSize: 9.5 },
  pdfButton: { marginTop: 14, minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: "#C9DDF1", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  pdfText: { color: "#0F76AE", fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
