import React from "react";
import { FlatList } from "react-native";

import PlanRow from "../components/PlanRow";

interface Props {
  rows: any[];
  doctors: any[];
  products: any[];
  onChange: (
    index: number,
    field: string,
    value: any
  ) => void;
  onDelete: (index: number) => void;
}

export default function PlanTable({
  rows,
  doctors,
  products,
  onChange,
  onDelete,
}: Props) {
  return (
    <FlatList
      data={rows}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item, index }) => (
        <PlanRow
          index={index}
          value={item}
          doctors={doctors}
          products={products}
          onDelete={() => onDelete(index)}
          onChange={(field: string, value: any) =>
            onChange(index, field, value)
          }
        />
      )}
    />
  );
}