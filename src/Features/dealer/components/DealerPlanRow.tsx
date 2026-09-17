import React from "react";
import { View, StyleSheet } from "react-native";

import LocalPartyPicker from "../../../components/forms/LocalPartyPicker";
import AppInput from "../../../components/ui/AppInput";
import AppDatePicker from "../../../components/ui/AppDatePicker";

interface Props {
  value: any;
  dealers: any[];
  employeeId: string;
  onChange: (field: string, value: any) => void;
}

export default function DealerPlanRow({
  value,
  dealers,
  employeeId,
  onChange,
}: Props) {
  return (
    <View style={styles.card}>
      <LocalPartyPicker
        employeeId={employeeId}
        type="dealer"
        label="Dealer"
        masterData={dealers}
        labelField="dealer_name"
        value={value.dealer_id}
        onChange={(item) => {
          onChange("dealer_id", item.id);
          onChange("dealer_name", item.name ?? item.dealer_name ?? "");
          onChange("dealer_is_local", Boolean(item.isLocal || String(item.id ?? "").startsWith("local-party:")));
        }}
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

      <AppInput
              label="Note"

              value={value.discussion}
              onChangeText={(text) => onChange("discussion", text)} placeholder={""}      />

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 4,
    elevation: 2,
  },
});
