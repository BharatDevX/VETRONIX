import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import { MonthlyTourSummary } from "../types/monthlyTourProgramme.types";

interface Props {
  summary: MonthlyTourSummary;
}

interface StatCardProps {
  title: string;
  value: string | number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <Card.Content style={styles.content}>
        <Text
          variant="bodyMedium"
          style={styles.title}
        >
          {title}
        </Text>

        <Text
          variant="headlineMedium"
          style={styles.value}
        >
          {value}
        </Text>
      </Card.Content>
    </Card>
  );
}

export default function SummaryCard({
  summary,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard
          title="Planned Days"
          value={summary.plannedDays}
        />

        <StatCard
          title="Total Tours"
          value={summary.totalTours}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          title="Expected KM"
          value={summary.totalKm}
        />

        <StatCard
          title="Customers"
          value={summary.totalCustomers}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 12,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  statCard: {
    flex: 1,
    borderRadius: 16,
  },

  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },

  title: {
    opacity: 0.7,
    marginBottom: 8,
    textAlign: "center",
  },

  value: {
    fontWeight: "700",
  },
});