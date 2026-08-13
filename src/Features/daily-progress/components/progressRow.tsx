import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

import Colors from "../../../theme/color";

import AppInput from "@/components/ui/AppInput";
import AppSearchDropdown from "@/components/ui/AppSearchDropdown";

export interface ProgressRowValue {
  id?: string;
  doctor_id: string | null;
  dealer_id: string | null;
  party_type: "doctor" | "dealer";
  party_name: string;
  contact_person: string;
  discussion: string;
  reply: string;
  pob_amount: string;
}

export interface PartyOption {
  id: string;
  name: string;
  type: "doctor" | "dealer";
  contact: string;
}

interface Props {
  index: number;
  value: ProgressRowValue;
  partyData: PartyOption[];
  readOnly?: boolean;
  onChange: (value: ProgressRowValue) => void;
  onDelete: () => void;
}

export default function ProgressRow({
  index,
  value,
  partyData,
  readOnly = false,
  onChange,
  onDelete,
}: Props) {
  function handleParty(item: any) {
    onChange({
      ...value,
      party_type: item.type,
      party_name: item.name,
      contact_person: item.contact,
      doctor_id: item.type === "doctor" ? item.id : null,
      dealer_id: item.type === "dealer" ? item.id : null,
    });
  }

  const partyTypeLabel = value.party_type === "dealer" ? "Dealer" : "Doctor";

  return (
    <View style={styles.card}>
      {/* ---------- CARD HEAD ---------- */}
      <View style={styles.headRow}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexBadgeText}>{index + 1}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Visit #{index + 1}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {value.party_name ? value.party_name : "Select a party to continue"}
          </Text>
        </View>

        <View style={styles.typePill}>
          <View style={styles.typeDot} />
          <Text style={styles.typePillText}>{partyTypeLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.fieldGroup}>
        <AppSearchDropdown
          label="Party"
          data={partyData}
          value={
            value.party_type === "doctor" ? value.doctor_id : value.dealer_id
          }
          labelField="name"
          valueField="id"
          onChange={handleParty}
        />

        <AppInput
          label="Contact Person"
          placeholder="Contact Person"
          value={value.contact_person}
          editable={!readOnly}
          onChangeText={(text) =>
            onChange({
              ...value,
              contact_person: text,
            })
          }
        />

        <AppInput
          label="Discussion"
          placeholder="Discussion"
          multiline
          numberOfLines={4}
          editable={!readOnly}
          value={value.discussion}
          onChangeText={(text) =>
            onChange({
              ...value,
              discussion: text,
            })
          }
        />

        <AppInput
          label="Reply"
          placeholder="Reply"
          multiline
          numberOfLines={4}
          editable={!readOnly}
          value={value.reply}
          onChangeText={(text) =>
            onChange({
              ...value,
              reply: text,
            })
          }
        />

        <AppInput
          label="POB Amount"
          placeholder="0"
          keyboardType="numeric"
          editable={!readOnly}
          value={value.pob_amount}
          onChangeText={(text) =>
            onChange({
              ...value,
              pob_amount: text,
            })
          }
        />
      </View>

      <View style={styles.pobStrip}>
        <Text style={styles.pobLabel}>POB for this visit</Text>
        <Text style={styles.pobValue}>
          ₹{Number(value.pob_amount || 0).toFixed(2)}
        </Text>
      </View>

      {!readOnly && (
        <TouchableOpacity
          style={styles.delete}
          activeOpacity={0.85}
          onPress={onDelete}
        >
          <Text style={styles.deleteText}>Delete Visit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E8EFF6",
    shadowColor: "#0E4C77",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  indexBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F3FB",
  },

  indexBadgeText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F76AE",
  },

  title: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#16324F",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: "500",
    color: "#8697A8",
  },

  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EDF6FC",
    borderWidth: 1,
    borderColor: "#D6EAF7",
  },

  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  typePillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F76AE",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF3F8",
    marginTop: 16,
  },

  fieldGroup: {
    gap: 12,
    marginTop: 16,
  },

  pobStrip: {
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#EDF6FC",
    borderWidth: 1,
    borderColor: "#D6EAF7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pobLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4C6379",
  },

  pobValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F76AE",
  },

  delete: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FDEDEC",
    borderWidth: 1,
    borderColor: "#F7D4D1",
  },

  deleteText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#D9483B",
  },
});
