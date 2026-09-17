import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Info,
  ShieldAlert,
  ClipboardList,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Colors from "../../../theme/color";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  getMyAdminMessages,
  subscribeToAdminMessages,
  updateMyAdminMessageStatus,
  type AdminEmployeeMessage,
} from "../services/adminMessage.service";
import { RootStackParamList } from "../../../navigation/AppNavigator";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function iconFor(type: AdminEmployeeMessage["message_type"]) {
  if (type === "warning") return AlertTriangle;
  if (type === "alert") return ShieldAlert;
  if (type === "order") return ClipboardList;
  return Info;
}

function typeLabel(type: AdminEmployeeMessage["message_type"]) {
  if (type === "warning") return "WARNING";
  if (type === "alert") return "ALERT";
  if (type === "order") return "ORDER";
  return "INFORMATION";
}

function typeColor(type: AdminEmployeeMessage["message_type"]) {
  if (type === "warning") return "#B45309";
  if (type === "alert") return "#DC2626";
  if (type === "order") return "#6D28D9";
  return Colors.primary;
}

export default function AdminNotificationsScreen() {
  const navigation = useNavigation<Navigation>();
  const employee = useAuthStore((state) => state.employee);
  const [messages, setMessages] = useState<AdminEmployeeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (showLoader = true) => {
    if (!employee?.id) return;

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const data = await getMyAdminMessages(employee.id);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [employee?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadMessages();
    }, [loadMessages]),
  );

  useEffect(() => {
    if (!employee?.id) return;

    const unsubscribe = subscribeToAdminMessages(employee.id, (incoming) => {
      setMessages((current) => {
        if (current.some((item) => item.id === incoming.id)) return current;
        return [incoming, ...current];
      });
    });

    return unsubscribe;
  }, [employee?.id]);

  const refresh = async () => {
    setRefreshing(true);
    await loadMessages(false);
    setRefreshing(false);
  };

  if (!employee) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIcon}>
          <Bell size={21} color="#FFFFFF" strokeWidth={2.3} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Instructions and messages from Admin</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{messages.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your messages...</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={messages.length ? styles.listContent : styles.emptyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={() => void loadMessages()} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Bell size={30} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                Instructions, warnings, alerts, and orders sent to you by Admin will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const Icon = iconFor(item.message_type);
            const accent = typeColor(item.message_type);

            return (
              <View style={styles.messageCard}>
                <View style={[styles.messageIcon, { backgroundColor: `${accent}14` }]}>
                  <Icon size={21} color={accent} strokeWidth={2.2} />
                </View>

                <View style={styles.messageContent}>
                  <View style={styles.messageTopRow}>
                    <Text style={styles.messageTitle}>{item.title}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: `${accent}14` }]}>
                      <Text style={[styles.typeText, { color: accent }]}>
                        {typeLabel(item.message_type)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.messageBody}>{item.message}</Text>

                  <View style={styles.timeRow}>
                    <Bell size={12} color="#94A3B8" strokeWidth={2} />
                    <Text style={styles.timeText}>
                      {new Date(item.created_at).toLocaleString("en-IN")}
                    </Text>
                  </View>

                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, item.status === "done" ? styles.doneBadge : styles.pendingBadge]}>
                      <Text style={[styles.statusText, item.status === "done" ? styles.doneText : styles.pendingText]}>
                        {item.status === "done" ? "DONE" : "PENDING"}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.statusButton, item.status === "done" && styles.statusButtonDone, pressed && styles.pressed]}
                      onPress={async () => {
                        if (!employee?.id) return;
                        try {
                          const updated = await updateMyAdminMessageStatus(employee.id, item.id, item.status === "done" ? "pending" : "done");
                          setMessages((current) => current.map((message) => message.id === updated.id ? updated : message));
                        } catch (error) {
                          setError(error instanceof Error ? error.message : "Unable to update message status.");
                        }
                      }}
                    >
                      <Text style={styles.statusButtonText}>{item.status === "done" ? "Mark Pending" : "Mark Done"}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F8FC" },
  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerText: { flex: 1 },
  headerTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  headerSubtitle: {
    marginTop: 2,
    color: "#DCEEFF",
    fontSize: 11.5,
    fontWeight: "600",
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: Colors.primary, fontSize: 13, fontWeight: "900" },
  listContent: { padding: 16, paddingBottom: 28 },
  emptyContent: { flexGrow: 1, padding: 16, justifyContent: "center" },
  messageCard: {
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  messageIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  messageContent: { flex: 1 },
  messageTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  messageTitle: {
    flex: 1,
    color: "#16324F",
    fontSize: 14.5,
    fontWeight: "900",
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeText: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.5 },
  messageBody: {
    marginTop: 8,
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
  },
  timeRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: { color: "#94A3B8", fontSize: 10.5 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, color: "#64748B", fontSize: 12 },
  emptyCard: {
    alignItems: "center",
    padding: 28,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#EAF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 16,
    color: "#16324F",
    fontSize: 17,
    fontWeight: "900",
  },
  emptyText: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: "center",
  },
  errorCard: {
    marginBottom: 12,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
  },
  errorText: { color: "#B91C1C", fontSize: 12, lineHeight: 18 },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  retryText: { color: Colors.primary, fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.75 },
  statusRow: { marginTop: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  doneBadge: { backgroundColor: "#DCFCE7" },
  pendingBadge: { backgroundColor: "#FEF3C7" },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  doneText: { color: "#15803D" },
  pendingText: { color: "#B45309" },
  statusButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.primary },
  statusButtonDone: { backgroundColor: "#64748B" },
  statusButtonText: { color: "#FFFFFF", fontSize: 10.5, fontWeight: "800" },
});
