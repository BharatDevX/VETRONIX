import React from "react";
import { FlatList } from "react-native";

import OutcomeRow from "./OutcomeRow";

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

export default function OutcomeTable({
  rows,
  doctors,
  products,
  onChange,
  onDelete,
}: Props) {
  return (
    <FlatList
      scrollEnabled={false}
      data={rows}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item, index }) => (
        <OutcomeRow
          value={item}
          doctors={doctors}
          products={products}
          onDelete={() => onDelete(index)}
          onChange={(field, value) =>
            onChange(index, field, value)
          }
        />
      )}
    />
  );
}