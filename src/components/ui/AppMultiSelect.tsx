import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MultiSelect } from "react-native-element-dropdown";

interface Props {
  label: string;
  data: any[];
  value: any[];
  labelField: string;
  valueField: string;
  onChange: (items: any[]) => void;
}

export default function AppMultiSelect({
  label,
  data,
  value,
  labelField,
  valueField,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <MultiSelect
        style={styles.dropdown}
        data={data}
        search
        labelField={labelField}
        valueField={valueField}
        placeholder={`Select ${label}`}
        searchPlaceholder="Search..."
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    fontWeight: "600",
    marginBottom: 6,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 55,
  },
});