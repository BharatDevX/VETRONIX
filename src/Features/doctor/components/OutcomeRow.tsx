import React from "react";
import { View, StyleSheet } from "react-native";

import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppMultiSelect from "../../../components/ui/AppMultiSelect";
import AppInput from "../../../components/ui/AppInput";
import PrimaryButton from "../../../components/ui/PrimaryButton";

interface Props {
  value: any;
  doctors: any[];
  products: any[];
  onChange: (field: string, value: any) => void;
  onDelete: () => void;
}

export default function OutcomeRow({
  value,
  doctors,
  products,
  onChange,
  onDelete,
}: Props) {
  return (
    <View style={styles.card}>
      <AppSearchDropdown
        label="Doctor"
        data={doctors}
        labelField="doctor_name"
        valueField="id"
        value={value.doctor_id}
        onChange={(item) => onChange("doctor_id", item.id)}
      />

      <AppInput
              label="Area"
              value={value.area}
              onChangeText={(text) => onChange("area", text)} placeholder={""}      />

      <AppMultiSelect
        label="Agreed Medicines"
        data={products}
        labelField="product_name"
        valueField="id"
        value={value.product_ids}
        onChange={(items) => onChange("product_ids", items)}
      />

      <AppInput
              label="Agreed %"

              value={String(value.agreed_percentage)}
              onChangeText={(text) => onChange("agreed_percentage", Number(text))} placeholder={""}      />

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