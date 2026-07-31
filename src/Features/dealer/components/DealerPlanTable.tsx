import React from "react";
import { FlatList } from "react-native";

import DealerPlanRow from "./DealerPlanRow";

interface Props {
  rows: any[];
  dealers: any[];
  onChange: (
    index: number,
    field: string,
    value: any
  ) => void;
  onDelete: (index: number) => void;
}

export default function DealerPlanTable({
  rows,
  dealers,
  onChange,
  onDelete,
}: Props) {
  return (
    <FlatList
      scrollEnabled={false}
      data={rows}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item, index }) => (
        <DealerPlanRow
          value={item}
          dealers={dealers}
          onDelete={() => onDelete(index)}
          onChange={(field, value) =>
            onChange(index, field, value)
          }
        />
      )}
    />
  );
}