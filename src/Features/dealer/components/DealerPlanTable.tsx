import React from "react";
import { FlatList } from "react-native";

import DealerPlanRow from "./DealerPlanRow";

interface Props {
  rows: any[];
  dealers: any[];
  employeeId: string;
  onChange: (
    index: number,
    field: string,
    value: any
  ) => void;
}

export default function DealerPlanTable({
  rows,
  dealers,
  employeeId,
  onChange,
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
          employeeId={employeeId}
          onChange={(field, value) =>
            onChange(index, field, value)
          }
        />
      )}
    />
  );
}