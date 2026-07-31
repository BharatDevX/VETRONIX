import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Card, Divider, Text } from "react-native-paper";

import { MonthlyTourEntry } from "../types/monthlyTourProgramme.types";

interface Props {
  entry: MonthlyTourEntry;
  editable?: boolean;
  onEdit: (entry: MonthlyTourEntry) => void;
  onDelete: (id: string) => void;
}

export default function TourEntryCard({
  entry,
  editable = true,
  onEdit,
  onDelete,
}: Props) {
  const handleDelete = () => {
    Alert.alert(
      "Delete Tour",
      "Are you sure you want to delete this tour?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(entry.id),
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>

        <Text variant="titleMedium">
          📅 {new Date(entry.tour_date).toDateString()}
        </Text>

        <Divider style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Type</Text>
          <Text>{entry.hq_ex_tour}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Route</Text>
          <Text style={styles.value}>
            {entry.route_plan_details}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Travel</Text>
          <Text>{entry.travel_mode || "-"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>KM</Text>
          <Text>{entry.total_km}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Customers</Text>
          <Text>{entry.total_customer_plan}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Route No.</Text>
          <Text>{entry.route_no || "-"}</Text>
        </View>

        {editable && (
          <>
            <Divider style={styles.divider} />

            <View style={styles.buttonRow}>
              <Button
                mode="contained-tonal"
                icon="pencil"
                onPress={() => onEdit(entry)}
              >
                Edit
              </Button>

              <Button
                mode="contained"
                icon="delete"
                buttonColor="#D32F2F"
                onPress={handleDelete}
              >
                Delete
              </Button>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },

  divider: {
    marginVertical: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },

  label: {
    fontWeight: "600",
    opacity: 0.7,
    flex: 1,
  },

  value: {
    flex: 2,
    textAlign: "right",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});