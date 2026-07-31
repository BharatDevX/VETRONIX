import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";

import { MonthlyTourEntry } from "../types/monthlyTourProgramme.types";

interface Props {
  visible: boolean;
  entry?: MonthlyTourEntry | null;
  onClose: () => void;
  onSave: (data: {
    tour_date: string;
    hq_ex_tour: "HQ" | "EX" | "TOUR";
    route_plan_details: string;
    total_km: number;
    travel_mode: string;
    total_customer_plan: number;
    route_no: string;
  }) => void;
}

export default function TourEntryForm({
  visible,
  entry,
  onClose,
  onSave,
}: Props) {
  const [tourDate, setTourDate] = useState("");
  const [type, setType] =
    useState<"HQ" | "EX" | "TOUR">("HQ");
  const [route, setRoute] = useState("");
  const [travelMode, setTravelMode] = useState("");
  const [km, setKm] = useState("");
  const [customers, setCustomers] = useState("");
  const [routeNo, setRouteNo] = useState("");

  useEffect(() => {
    if (entry) {
      setTourDate(entry.tour_date);
      setType(entry.hq_ex_tour);
      setRoute(entry.route_plan_details);
      setTravelMode(entry.travel_mode ?? "");
      setKm(String(entry.total_km));
      setCustomers(String(entry.total_customer_plan));
      setRouteNo(entry.route_no ?? "");
    } else {
      setTourDate("");
      setType("HQ");
      setRoute("");
      setTravelMode("");
      setKm("");
      setCustomers("");
      setRouteNo("");
    }
  }, [entry, visible]);

  const handleSave = () => {
    onSave({
      tour_date: tourDate,
      hq_ex_tour: type,
      route_plan_details: route,
      total_km: Number(km),
      travel_mode: travelMode,
      total_customer_plan: Number(customers),
      route_no: routeNo,
    });

    onClose();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
      >
        <View style={styles.container}>
          <ScrollView>
            <Text
              variant="headlineSmall"
              style={styles.title}
            >
              {entry ? "Edit Tour" : "Add Tour"}
            </Text>

            <TextInput
              label="Tour Date (YYYY-MM-DD)"
              value={tourDate}
              onChangeText={setTourDate}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="HQ / EX / TOUR"
              value={type}
              onChangeText={(v) =>
                setType(v as any)
              }
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Route Details"
              value={route}
              onChangeText={setRoute}
              mode="outlined"
              multiline
              style={styles.input}
            />

            <TextInput
              label="Travel Mode"
              value={travelMode}
              onChangeText={setTravelMode}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Total KM"
              value={km}
              onChangeText={setKm}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Customer Plan"
              value={customers}
              onChangeText={setCustomers}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Route No"
              value={routeNo}
              onChangeText={setRouteNo}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.buttons}>
              <Button
                mode="outlined"
                onPress={onClose}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleSave}
              >
                Save
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: "85%",
  },

  title: {
    marginBottom: 20,
  },

  input: {
    marginBottom: 14,
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});