import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Chip, Text } from "react-native-paper";

import { MonthlyTourProgramme } from "../types/monthlyTourProgramme.types";

interface Props {
  programme: MonthlyTourProgramme | null;
  employeeName: string;
}

const statusColor = (
  status?: MonthlyTourProgramme["status"]
): "primary" | "secondary" | "error" | "tertiary" => {
  switch (status) {
    case "approved":
      return "primary";

    case "submitted":
      return "secondary";

    case "rejected":
      return "error";

    default:
      return "tertiary";
  }
};

const monthName = (month?: number) => {
  if (!month) return "";

  return new Date(2025, month - 1).toLocaleString("default", {
    month: "long",
  });
};

export default function TourHeader({
  programme,
  employeeName,
}: Props) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="headlineSmall">
          Monthly Tour Programme
        </Text>

        <Text
          variant="titleMedium"
          style={styles.month}
        >
          {monthName(programme?.month)} {programme?.year}
        </Text>

        <View style={styles.info}>
          <Text variant="bodyLarge">
            👤 {employeeName}
          </Text>

          <Text variant="bodyMedium">
            💼 {programme?.designation || "-"}
          </Text>

          <Text variant="bodyMedium">
            📍 {programme?.hq || "-"}
          </Text>
        </View>

        <Chip
          mode="flat"
          compact
          style={styles.chip}
        >
          {(programme?.status || "draft").toUpperCase()}
        </Chip>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },

  month: {
    marginTop: 4,
    opacity: 0.7,
  },

  info: {
    marginTop: 16,
    gap: 8,
  },

  chip: {
    alignSelf: "flex-start",
    marginTop: 16,
  },
});