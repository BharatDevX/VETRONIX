import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
  Text,
} from "react-native";

import dayjs from "dayjs";

import Colors from "../../../theme/color";

import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppInput from "../../../components/ui/AppInput";
import PrimaryButton from "../../../components/ui/PrimaryButton";

import ProgressRow, {
  PartyOption,
  ProgressRowValue,
} from "../components/progressRow";

import { useAuthStore } from "../../auth/store/auth.store";
import { useDailyProgress } from "../hooks/useDailyProgress";
import { DailyProgressEntry } from "../types/dailyProgress.types";

import { getDoctors, getDealers } from "../../master/services/master.service";

export default function DailyProgressScreen() {
  const employee = useAuthStore((state) => state.employee);

  const {
    progress,
    entries,
    loading,
    loadToday,
    createEntry,
    updateEntry,
    deleteEntry,
    saveDraft,
    submit,
    refresh,
  } = useDailyProgress();

  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [rows, setRows] = useState<ProgressRowValue[]>([]);
  const [removedRowIds, setRemovedRowIds] = useState<string[]>([]);

  const isReadOnly = progress?.status === "submitted";

  useEffect(() => {
    if (!employee) {
      return;
    }

    void loadInitial();
  }, [employee?.id]);

  useEffect(() => {
    setRows(
      entries.map((entry: DailyProgressEntry) => ({
        id: entry.id,
        doctor_id: entry.doctor_id,
        dealer_id: entry.dealer_id,
        party_type: entry.party_type,
        party_name: "",
        contact_person: entry.contact_person ?? "",
        discussion: entry.discussion ?? "",
        reply: entry.reply ?? "",
        pob_amount: entry.pob_amount != null ? String(entry.pob_amount) : "",
      }))
    );
  }, [entries]);

  async function loadInitial() {
    if (!employee) {
      return;
    }

    try {
      await loadToday(employee.id);

      const [doctorList, dealerList] = await Promise.all([
        getDoctors(),
        getDealers(),
      ]);

      setDoctors(doctorList);
      setDealers(dealerList);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Unable to load daily progress.");
    }
  }

  const partyData = useMemo<PartyOption[]>(() => {
    return [
      ...doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.doctor_name,
        type: "doctor" as const,
        contact: doctor.doctor_name,
      })),
      ...dealers.map((dealer) => ({
        id: dealer.id,
        name: dealer.dealer_name,
        type: "dealer" as const,
        contact: dealer.contact_person,
      })),
    ];
  }, [doctors, dealers]);

  function handleAddRow() {
    if (isReadOnly) {
      return;
    }

    setRows((prev) => [
      ...prev,
      {
        id: undefined,
        doctor_id: null,
        dealer_id: null,
        party_type: "doctor",
        party_name: "",
        contact_person: "",
        discussion: "",
        reply: "",
        pob_amount: "",
      },
    ]);
  }

  function handleDeleteRow(index: number) {
    if (isReadOnly) {
      return;
    }

    const rowToDelete = rows[index];

    if (rowToDelete?.id) {
      setRemovedRowIds((prev) => [...prev, rowToDelete.id as string]);
    }

    setRows((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleRowChange(index: number, value: ProgressRowValue) {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? value : row)));
  }

  function buildEntryPayload(row: ProgressRowValue) {
    return {
      party_type: row.party_type,
      doctor_id: row.doctor_id,
      dealer_id: row.dealer_id,
      contact_person: row.contact_person,
      discussion: row.discussion,
      reply: row.reply,
      pob_amount: Number(row.pob_amount || 0),
    };
  }

  async function persistRows() {
    const nextRows = [...rows];

    for (let index = 0; index < nextRows.length; index += 1) {
      const row = nextRows[index];
      const shouldDelete = row.id ? removedRowIds.includes(row.id) : false;

      if (shouldDelete) {
        continue;
      }

      if (row.id) {
        const updated = (await updateEntry(row.id, buildEntryPayload(row))) as DailyProgressEntry | undefined;
        nextRows[index] = {
          ...row,
          id: updated?.id ?? row.id,
          doctor_id: updated?.doctor_id ?? row.doctor_id,
          dealer_id: updated?.dealer_id ?? row.dealer_id,
          party_type: updated?.party_type ?? row.party_type,
          contact_person: updated?.contact_person ?? row.contact_person,
          discussion: updated?.discussion ?? row.discussion,
          reply: updated?.reply ?? row.reply,
          pob_amount: updated?.pob_amount != null ? String(updated.pob_amount) : row.pob_amount,
        };
      } else {
        const created = (await createEntry({
          ...buildEntryPayload(row),
          daily_progress_id: progress?.id ?? "",
          serial_no: 1,
        } as DailyProgressEntry)) as DailyProgressEntry | undefined;

        nextRows[index] = {
          ...row,
          id: created?.id,
          doctor_id: created?.doctor_id ?? row.doctor_id,
          dealer_id: created?.dealer_id ?? row.dealer_id,
          party_type: created?.party_type ?? row.party_type,
          contact_person: created?.contact_person ?? row.contact_person,
          discussion: created?.discussion ?? row.discussion,
          reply: created?.reply ?? row.reply,
          pob_amount: created?.pob_amount != null ? String(created.pob_amount) : row.pob_amount,
        };
      }
    }

    for (const removedId of removedRowIds) {
      if (removedId) {
        await deleteEntry(removedId);
      }
    }

    setRows(nextRows);
    setRemovedRowIds([]);
  }

  async function handleSaveDraft() {
    if (isReadOnly) {
      return;
    }

    setSaving(true);

    try {
      await persistRows();
      await saveDraft("");
      Alert.alert("Success", "Draft Saved Successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Unable to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (isReadOnly) {
      return;
    }

    const hasRows = rows.length > 0;
    const isValid = rows.every((row) => {
      const hasParty = Boolean(row.party_type && (row.doctor_id || row.dealer_id));
      const hasDiscussion = Boolean(row.discussion?.trim());
      const hasReply = Boolean(row.reply?.trim());
      const hasPobAmount = Boolean(row.pob_amount?.trim());

      return hasRows && hasParty && hasDiscussion && hasReply && hasPobAmount;
    });

    if (!hasRows || !isValid) {
      Alert.alert("Validation Error", "Please complete all row details before submitting.");
      return;
    }

    setSaving(true);

    try {
      await persistRows();
      await submit();
      await refresh();
      Alert.alert("Success", "Report Submitted Successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Unable to submit report.");
    } finally {
      setSaving(false);
    }
  }

  if (!employee) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ScreenHeader title="Daily Progress" />

      <View style={styles.card}>
        <AppInput
          label="Date"
          placeholder=""
          editable={false}
          value={progress ? dayjs(progress.report_date).format("DD MMM YYYY") : ""}
          onChangeText={() => {}}
        />

        <AppInput
          label="Start Meter"
          placeholder=""
          editable={false}
          value={progress ? String(progress.start_meter) : ""}
          onChangeText={() => {}}
        />

        <AppInput
          label="End Meter"
          placeholder=""
          editable={false}
          value={progress ? String(progress.end_meter) : ""}
          onChangeText={() => {}}
        />

        <AppInput
          label="Total KM"
          placeholder=""
          editable={false}
          value={progress ? String(progress.total_km) : ""}
          onChangeText={() => {}}
        />
      </View>

      <View style={styles.actionsRow}>
        <PrimaryButton title="Add Row" onPress={handleAddRow} disabled={isReadOnly} />
      </View>

      {rows.map((row, index) => (
        <ProgressRow
          key={`${row.id ?? "new"}-${index}`}
          index={index}
          value={row}
          partyData={partyData}
          readOnly={isReadOnly}
          onDelete={() => handleDeleteRow(index)}
          onChange={(value) => handleRowChange(index, value)}
        />
      ))}

      {!rows.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No visits added yet.</Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <PrimaryButton title="Save Draft" onPress={handleSaveDraft} disabled={isReadOnly || saving} loading={saving} />
        {!isReadOnly ? (
          <PrimaryButton title="Submit" onPress={handleSubmit} disabled={saving} loading={saving} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 32,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  actionsRow: {
    gap: 12,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    color: "#777",
    fontSize: 14,
  },
});