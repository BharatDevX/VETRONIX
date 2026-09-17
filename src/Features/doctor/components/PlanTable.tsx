import React from "react";
import { FlatList } from "react-native";
import PlanRow from "../components/PlanRow";

interface Props {
  rows: any[];
  doctors: any[];
  employeeId: string;
  onChange: (index: number, field: string, value: any) => void;
}

export default function PlanTable({ rows, doctors, employeeId, onChange }: Props) {
  return (
    <FlatList
      scrollEnabled={false}
      data={rows}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item, index }) => (
        <PlanRow
          value={item}
          doctors={doctors}
          employeeId={employeeId}
          onChange={(field: string, value: any) => onChange(index, field, value)}
        />
      )}
    />
  );
}
