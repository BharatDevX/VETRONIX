import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { AlertTriangle, Bell, Info, ShieldAlert } from "lucide-react-native";

import Colors from "../../theme/color";
import { useAuthStore } from "../../Features/auth/store/auth.store";
import {
  subscribeToAdminMessages,
  type AdminEmployeeMessage,
} from "../../Features/admin-messages/services/adminMessage.service";

function iconFor(type: AdminEmployeeMessage["message_type"]) {
  if (type === "warning") return AlertTriangle;
  if (type === "alert") return ShieldAlert;
  return type === "info" ? Info : Bell;
}

export default function AdminMessageListener() {
  const employee = useAuthStore((state) => state.employee);
  const [message, setMessage] = useState<AdminEmployeeMessage | null>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (!employee?.id) return;

    const unsubscribe = subscribeToAdminMessages(employee.id, async (incoming) => {
      if (seenIds.current.has(incoming.id)) return;
      seenIds.current.add(incoming.id);
      setMessage(incoming);

      // Also show the native notification while the app is active.
      // The exact admin-written message is kept as the notification body.
      try {
        const permissions = await Notifications.getPermissionsAsync();
        if (permissions.granted) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: incoming.title,
              body: incoming.message,
              data: { messageId: incoming.id },
            },
            trigger: null,
          });
        }
      } catch {
        // The in-app realtime message remains available even if local notification fails.
      }
    });

    return unsubscribe;
  }, [employee?.id]);

  if (!message) return null;

  const Icon = iconFor(message.message_type);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => setMessage(null)}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconShell}>
            <Icon size={24} color={Colors.primary} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{message.title}</Text>
            <Text style={styles.message}>{message.message}</Text>
            <Text style={styles.time}>
              {new Date(message.created_at).toLocaleString("en-IN")}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closePressed,
            ]}
            onPress={() => setMessage(null)}
          >
            <Text style={styles.closeText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-start",
    paddingTop: 70,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconShell: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EAF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: "#16324F",
    fontSize: 15,
    fontWeight: "900",
  },
  message: {
    marginTop: 7,
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
  },
  time: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 10.5,
  },
  closeButton: {
    minWidth: 48,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  closePressed: {
    opacity: 0.78,
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});
