import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppInput from "../ui/AppInput";
import AppSearchDropdown from "../ui/AppSearchDropdown";
import {
  addLocalParty,
  getLocalParties,
  isLocalPartyId,
  LocalParty,
  LocalPartyType,
} from "../../services/local/localParty.service";

interface Props {
  employeeId: string;
  type: LocalPartyType;
  label: string;
  masterData: any[];
  labelField: string;
  value: string;
  onChange: (item: any) => void;
}

export default function LocalPartyPicker({
  employeeId,
  type,
  label,
  masterData,
  labelField,
  value,
  onChange,
}: Props) {
  const [localParties, setLocalParties] = useState<LocalParty[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    let active = true;
    getLocalParties(employeeId, type).then((items) => {
      if (active) setLocalParties(items);
    });
    return () => {
      active = false;
    };
  }, [employeeId, type]);

  const data = useMemo(() => {
    const master = (Array.isArray(masterData) ? masterData : []).map((item) => ({
      ...item,
      name: String(item?.[labelField] ?? "").trim(),
    }));
    const names = new Set(master.map((item) => item.name.toLowerCase()).filter(Boolean));
    return [
      ...master,
      ...localParties.filter((item) => !names.has(item.name.toLowerCase())),
    ];
  }, [masterData, labelField, localParties]);

  async function addNewParty() {
    const normalized = newName.trim().replace(/\s+/g, " ");
    if (!normalized) {
      Alert.alert(`New ${label}`, `Please enter a ${label.toLowerCase()} name.`);
      return;
    }

    const masterExists = (Array.isArray(masterData) ? masterData : []).some(
      (master) => String(master?.[labelField] ?? "").trim().toLowerCase() === normalized.toLowerCase(),
    );
    if (masterExists) {
      Alert.alert(`${label} already exists`, "Please select it from the dropdown instead.");
      return;
    }

    const item = await addLocalParty(employeeId, type, normalized);
    if (!item) return;

    setLocalParties(await getLocalParties(employeeId, type));
    setNewName("");
    onChange(item);
  }

  return (
    <View>
      <AppSearchDropdown
        label={label}
        data={data}
        labelField="name"
        valueField="id"
        value={value}
        placeholder={`Select ${label}`}
        onChange={(item) => {
          if (isLocalPartyId(item?.id)) {
            onChange(item);
            return;
          }
          onChange(item);
        }}
      />

      <Text style={styles.orText}>Not in the list? Add only for this employee</Text>
      <View style={styles.newPartyRow}>
        <View style={styles.inputWrap}>
          <AppInput
            label={`New ${label} Name`}
            value={newName}
            onChangeText={setNewName}
            placeholder={`Enter ${label.toLowerCase()} name`}
          />
        </View>
        <View style={styles.addButtonWrap}>
          <Text style={styles.addButton} onPress={addNewParty}>Add</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orText: {
    marginTop: -6,
    marginBottom: 8,
    fontSize: 12,
    color: "#7A808A",
  },
  newPartyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  inputWrap: { flex: 1 },
  addButtonWrap: { marginBottom: 16 },
  addButton: {
    backgroundColor: "#111827",
    color: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 10,
    overflow: "hidden",
    fontWeight: "700",
  },
});
