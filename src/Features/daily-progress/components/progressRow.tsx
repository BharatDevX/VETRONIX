import React, { useEffect, useMemo, useState } from "react";
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

      doctor_id:
        item.type === "doctor"
          ? item.id
          : null,

      dealer_id:
        item.type === "dealer"
          ? item.id
          : null,

    });

  }

  return (

    <View style={styles.card}>

      <Text style={styles.title}>
        Visit #{index + 1}
      </Text>

      <AppSearchDropdown

        label="Party"

        data={partyData}

        value={
          value.party_type === "doctor"
            ? value.doctor_id
            : value.dealer_id
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

      {!readOnly && (

        <TouchableOpacity
          style={styles.delete}
          onPress={onDelete}
        >

          <Text style={styles.deleteText}>
            Delete Row
          </Text>

        </TouchableOpacity>

      )}

    </View>

  );

}

const styles = StyleSheet.create({

  card: {

    backgroundColor: "#fff",

    borderRadius: 12,

    padding: 16,

    marginBottom: 20,

    elevation: 2,

  },

  title: {

    fontSize: 16,

    fontWeight: "700",

    color: Colors.primary,

    marginBottom: 15,

  },

  delete: {

    marginTop: 15,

    backgroundColor: "#E53935",

    padding: 12,

    borderRadius: 10,

    alignItems: "center",

  },

  deleteText: {

    color: "#fff",

    fontWeight: "600",

  },

});