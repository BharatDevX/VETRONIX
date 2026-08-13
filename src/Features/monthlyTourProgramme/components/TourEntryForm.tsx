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
  SegmentedButtons,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
          <View style={styles.header}>
            <View style={styles.grabber} />

            <Text style={styles.eyebrow}>
              Monthly Tour Programme
            </Text>

            <Text style={styles.title}>
              {entry ? "Edit Tour" : "Add Tour"}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            <Text style={styles.label}>Tour Date</Text>

            <TextInput
  mode="outlined"
  label="Tour Date"
  value={tourDate}
  editable={false}
  outlineColor="#E3E8F0"
  activeOutlineColor="#1D9C6E"
  outlineStyle={styles.inputOutline}
  style={styles.field}
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
    onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
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
              <Text style={styles.label}>Visit Type</Text>
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

            <Text style={styles.label}>Route Details</Text>

            <TextInput
              label="Route Details"
              value={route}
              onChangeText={setRoute}
              mode="outlined"
              multiline
              outlineColor="#E3E8F0"
              activeOutlineColor="#1D9C6E"
              outlineStyle={styles.inputOutline}
              style={[styles.field, styles.input]}
            />

            <View style={styles.input}>
              <Text style={styles.label}>Travel Mode</Text>
             <Dropdown
  style={{
    borderWidth: 1,
    borderColor: "#E3E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 55,
    backgroundColor: "#F8FAFC",
  }}
  placeholderStyle={{
    color: "#9AA1AC",
    fontSize: 14.5,
  }}
  selectedTextStyle={{
    color: "#101418",
    fontSize: 14.5,
    fontWeight: "600",
  }}
  itemTextStyle={{
    color: "#101418",
    fontSize: 14.5,
  }}
  containerStyle={{
    borderRadius: 14,
    borderColor: "#EEF1F6",
    overflow: "hidden",
  }}
  activeColor="#E7F7F0"
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

            <View style={styles.pairRow}>
              <View style={styles.pairItem}>
                <Text style={styles.label}>Total KM</Text>

                <TextInput
                  label="Total KM"
                  value={km}
                  onChangeText={setKm}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor="#E3E8F0"
                  activeOutlineColor="#1D9C6E"
                  outlineStyle={styles.inputOutline}
                  style={[styles.field, styles.input]}
                />
              </View>

              <View style={styles.pairItem}>
                <Text style={styles.label}>Customer Plan</Text>

                <TextInput
                  label="Customer Plan"
                  value={customers}
                  onChangeText={setCustomers}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor="#E3E8F0"
                  activeOutlineColor="#1D9C6E"
                  outlineStyle={styles.inputOutline}
                  style={[styles.field, styles.input]}
                />
              </View>
            </View>

            <Text style={styles.label}>Route No</Text>

            <TextInput
              label="Route No"
              value={routeNo}
              onChangeText={setRouteNo}
              mode="outlined"
              outlineColor="#E3E8F0"
              activeOutlineColor="#1D9C6E"
              outlineStyle={styles.inputOutline}
              style={[styles.field, styles.input]}
            />

            <View style={styles.buttons}>
             <Button
    mode="outlined"
    icon="close"
    onPress={onClose}
    style={styles.actionButton}
    contentStyle={styles.actionContent}
    labelStyle={styles.actionLabel}
    textColor="#6B7280"
>

Cancel

</Button>

<Button
    mode="contained"
    icon="content-save"
    onPress={handleSave}
    style={styles.actionButton}
    contentStyle={styles.actionContent}
    labelStyle={styles.actionLabel}
    buttonColor="#1D9C6E"
    textColor="#FFFFFF"
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
    backgroundColor: "#FFFFFF",
    margin: 18,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },

  header: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F4F9",
    marginBottom: 16,
  },

  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#E3E8F0",
    marginBottom: 14,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "#8A8F98",
  },

  title: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: "800",
    color: "#101418",
    letterSpacing: -0.4,
  },

  body: {
    paddingBottom: 6,
  },

  field: {
    backgroundColor: "#F8FAFC",
  },

  inputOutline: {
    borderRadius: 14,
    borderWidth: 1,
  },

  input: {
    marginBottom: 14,
  },

  label: {
    marginBottom: 8,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#8A8F98",
  },

  pairRow: {
    flexDirection: "row",
    gap: 12,
  },

  pairItem: {
    flex: 1,
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F4F9",
  },

  actionButton: {
    flex: 1,
    borderRadius: 999,
    borderColor: "#E3E8F0",
  },

  actionContent: {
    paddingVertical: 4,
  },

  actionLabel: {
    fontWeight: "700",
  },
});
