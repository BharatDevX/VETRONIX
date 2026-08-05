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
  Menu,
  SegmentedButtons,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MonthlyTourEntry } from "../types/monthlyTourProgramme.types";
import { Dropdown } from "react-native-element-dropdown";

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
  const [travelModeMenuVisible, setTravelModeMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [km, setKm] = useState("");
  const [customers, setCustomers] = useState("");
  const [routeNo, setRouteNo] = useState("");
const [showDatePicker, setShowDatePicker] = useState(false);

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
  mode="outlined"
  label="Tour Date"
  value={tourDate}
  editable={false}
  right={
    <TextInput.Icon
      icon="calendar"
      onPress={() => setShowDatePicker(true)}
    />
  }
/>
{showDatePicker && (
  <DateTimePicker
    value={
      tourDate
        ? new Date(tourDate)
        : new Date()
    }
    mode="date"
    display="default"
    onChange={(event: any, selectedDate: { toISOString: () => string; }) => {
      setShowDatePicker(false);

      if (selectedDate) {
        setTourDate(
          selectedDate
            .toISOString()
            .split("T")[0]
        );
      }
    }}
  />
)}

            <View style={styles.input}>
              <Text variant="labelMedium" style={styles.label}>Visit Type</Text>
              <SegmentedButtons
  value={type}
  onValueChange={(v) =>
    setType(v as "HQ" | "EX" | "TOUR")
  }
  buttons={[
    {
      value: "HQ",
      label: "HQ",
      icon: "office-building",
    },
    {
      value: "EX",
      label: "EX",
      icon: "map-marker-radius",
    },
    {
      value: "TOUR",
      label: "Tour",
      icon: "car",
    },
  ]}
/>
            </View>

            <TextInput
              label="Route Details"
              value={route}
              onChangeText={setRoute}
              mode="outlined"
              multiline
              style={styles.input}
            />

            <View style={styles.input}>
              <Text variant="labelMedium" style={styles.label}>Travel Mode</Text>
             <Dropdown
  style={{
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 55,
  }}
  placeholderStyle={{
    color: "#888",
  }}
  selectedTextStyle={{
    color: "#000",
  }}
  data={[
    {
      label: "Bike",
      value: "Bike",
    },
    {
      label: "Car",
      value: "Car",
    },
    {
      label: "Bus",
      value: "Bus",
    },
    {
      label: "Train",
      value: "Train",
    },
    {
      label: "Flight",
      value: "Flight",
    },
    {
      label: "Walk",
      value: "Walk",
    },
  ]}
  labelField="label"
  valueField="value"
  placeholder="Select Travel Mode"
  value={travelMode}
  onChange={(item) => {
    setTravelMode(item.value);
  }}
/>
            </View>

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
    icon="close"
    onPress={onClose}
>

Cancel

</Button>

<Button
    mode="contained"
    icon="content-save"
    onPress={handleSave}
>

Save Tour

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
  label: {
    marginBottom: 8,
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});