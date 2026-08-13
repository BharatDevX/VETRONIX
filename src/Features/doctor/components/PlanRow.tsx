import React from "react";
import { View, StyleSheet } from "react-native";

import AppInput from "../../../components/ui/AppInput";
import AppSearchDropdown from "../../../components/ui/AppSearchDropdown";
import AppMultiSelect from "../../../components/ui/AppMultiSelect";
import AppDatePicker from "../../../components/ui/AppDatePicker";
import PrimaryButton from "../../../components/ui/PrimaryButton";

interface Props {
  index: number;
  value: any;
  doctors: any[];
  products: any[];
  onChange: (field: string, value: any) => void;
  onDelete: () => void;
}

export default function PlanRow({
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
        onChange={(item: any) => onChange("doctor_id", item.id)}
      />

      <AppInput
              label="Location"
              value={value.location}
              onChangeText={(text) => onChange("location", text)} placeholder={""}      />

      <AppDatePicker
        label="Planned Date"
        value={value.planned_date}
        onChange={(date: any) => onChange("planned_date", date)}
      />

      <AppInput
              label="Discussion"
              value={value.discussion}
              onChangeText={(text: string) => onChange("discussion", text)} placeholder={""}      />

      <AppInput
              label="Reply"
              value={value.reply}
              onChangeText={(text: string) => onChange("reply", text.slice(0, 1000))}
              placeholder=""
              multiline
              numberOfLines={4}
      />

      <AppMultiSelect
        label="Agreed Medicines"
        data={products}
        labelField="product_name"
        valueField="id"
        value={value.product_ids}
        onChange={(items: any) => onChange("product_ids", items)}
      />

      <PrimaryButton
        title="Delete Row"
        onPress={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#FFF",
    elevation: 2,
  },
});
