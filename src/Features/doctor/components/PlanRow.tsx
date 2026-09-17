import React from "react";
import { View, StyleSheet } from "react-native";
import AppInput from "../../../components/ui/AppInput";
import LocalPartyPicker from "../../../components/forms/LocalPartyPicker";
import AppDatePicker from "../../../components/ui/AppDatePicker";

interface Props {
  value: any;
  doctors: any[];
  employeeId: string;
  onChange: (field: string, value: any) => void;
}

export default function PlanRow({ value, doctors, employeeId, onChange }: Props) {
  return (
    <View style={styles.card}>
      <LocalPartyPicker
        employeeId={employeeId}
        type="doctor"
        label="Doctor"
        masterData={doctors}
        labelField="doctor_name"
        value={value.doctor_id}
        onChange={(item: any) => {
          onChange("doctor_id", item.id);
          onChange("doctor_name", item.name ?? item.doctor_name ?? "");
          onChange("doctor_is_local", Boolean(item.isLocal || String(item.id ?? "").startsWith("local-party:")));
        }}
      />

      <AppInput
        label="Location"
        value={value.location}
        onChangeText={(text) => onChange("location", text)}
        placeholder=""
      />

      <AppDatePicker
        label="Planned Date"
        value={value.planned_date}
        onChange={(date: any) => onChange("planned_date", date)}
      />

      <AppInput
        label="Notes"
        value={value.reply}
        onChangeText={(text: string) => onChange("reply", text.slice(0, 1000))}
        placeholder=""
        multiline
        numberOfLines={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: "#FFF",
    elevation: 2,
  },
});
