import React from "react";
import { View, StyleSheet } from "react-native";

import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppInput from "../../../components/ui/AppInput";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import PrimaryButton from "../../../components/ui/PrimaryButton";

interface Props {
  value: any;
  dealers: any[];
  onChange: (field: string, value: any) => void;
  onDelete: () => void;
}

export default function DealerPlanRow({
  value,
  dealers,
  onChange,
  onDelete,
}: Props) {
  return (
    <View style={styles.card}>
      <AppSearchDropdown
        label="Dealer"
        data={dealers}
        labelField="dealer_name"
        valueField="id"
        value={value.dealer_id}
        onChange={(item) => onChange("dealer_id", item.id)}
      />

      <AppInput
              label="Location"
              value={value.location}
              onChangeText={(text) => onChange("location", text)} placeholder={""}      />

      <AppDatePicker
        label="Planned Date"
        value={value.planned_date}
        onChange={(date) => onChange("planned_date", date)}
      />

      <AppDatePicker
        label="Meeting Date"
        value={value.meeting_date}
        onChange={(date) => onChange("meeting_date", date)}
      />

      <AppInput
              label="Discussion"

              value={value.discussion}
              onChangeText={(text) => onChange("discussion", text)} placeholder={""}      />

      <PrimaryButton
        title="Delete Row"
        onPress={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
});