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

  // ---- presentation-only derived values ----
  const totalPob = rows.reduce((sum, row) => sum + Number(row.pob_amount || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Daily Progress" subtitle="Today's visits and POB report" />

      {/* ---------- HERO / DAY SUMMARY ---------- */}
      <View style={styles.hero}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>DAY REPORT</Text>
          </View>

          <View style={styles.heroPill}>
            <View
              style={[
                styles.heroPillDot,
                { backgroundColor: isReadOnly ? "#7FE3B8" : "#FFD37A" },
              ]}
            />
            <Text style={styles.heroPillText}>
              {isReadOnly ? "Submitted" : "Draft"}
            </Text>
          </View>
        </View>

        <Text style={styles.heroDate}>
          {progress ? dayjs(progress.report_date).format("DD MMM YYYY") : dayjs().format("DD MMM YYYY")}
        </Text>
        <Text style={styles.heroDay}>
          {progress ? dayjs(progress.report_date).format("dddd") : dayjs().format("dddd")}
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaTile}>
            <Text style={styles.heroMetaLabel}>VISITS</Text>
            <Text style={styles.heroMetaValue}>{rows.length}</Text>
          </View>

          <View style={styles.heroMetaTile}>
            <Text style={styles.heroMetaLabel}>TOTAL KM</Text>
            <Text style={styles.heroMetaValue}>
              {progress ? String(progress.total_km) : "0"}
            </Text>
          </View>

          <View style={styles.heroMetaTile}>
            <Text style={styles.heroMetaLabel}>POB</Text>
            <Text style={styles.heroMetaValue}>₹{totalPob.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      {/* ---------- TRAVEL DETAILS ---------- */}
      <View style={styles.card}>
        <View style={styles.sectionHeadRow}>
          <View style={styles.accentBar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Travel Details</Text>
            <Text style={styles.cardSubtitle}>Auto-filled from your work session</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
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
      </View>

      {/* ---------- VISITS ---------- */}
      <View style={styles.visitsHeadRow}>
        <View style={styles.sectionHeadRow}>
          <View style={styles.accentBar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Visits</Text>
            <Text style={styles.cardSubtitle}>
              {rows.length ? `${rows.length} visit${rows.length > 1 ? "s" : ""} recorded` : "Add the parties you met today"}
            </Text>
          </View>
        </View>

        <View style={styles.countChip}>
          <Text style={styles.countChipText}>{rows.length}</Text>
        </View>
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
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>＋</Text>
          </View>
          <Text style={styles.emptyTitle}>No visits added yet</Text>
          <Text style={styles.emptyText}>
            Tap “Add Row” to record your first visit of the day.
          </Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <PrimaryButton title="Save Draft" onPress={handleSaveDraft} disabled={isReadOnly || saving} loading={saving} />
        {!isReadOnly ? (
          <PrimaryButton title="Submit" onPress={handleSubmit} disabled={saving} loading={saving} />
        ) : null}
        <Text style={styles.helperNote}>
          {isReadOnly
            ? "This report has been submitted and is read-only."
            : "Save a draft anytime — submit once the day is complete."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FC",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 44,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8FC",
  },

  /* ---------- HERO ---------- */
  hero: {
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 18,
    backgroundColor: "#0F76AE",
    overflow: "hidden",
    shadowColor: "#00416E",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },

  heroGlowOne: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -90,
    right: -60,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  heroGlowTwo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    bottom: -110,
    left: -70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  heroBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#FFFFFF",
  },

  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  heroPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  heroPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  heroDate: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#FFFFFF",
  },

  heroDay: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: "#CFE8FF",
  },

  heroMetaRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },

  heroMetaTile: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  heroMetaLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#BFDFFA",
  },

  heroMetaValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* ---------- CARDS / SECTIONS ---------- */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8EFF6",
    shadowColor: "#0E4C77",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },

  accentBar: {
    width: 4,
    height: 30,
    borderRadius: 3,
    backgroundColor: "#1597D4",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16324F",
  },

  cardSubtitle: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#8697A8",
    marginTop: 3,
  },

  fieldGroup: {
    gap: 12,
    marginTop: 14,
  },

  visitsHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  countChip: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#E6F3FB",
    alignItems: "center",
  },

  countChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F76AE",
  },

  actionsRow: {
    gap: 12,
    marginBottom: 18,
  },

  /* ---------- EMPTY STATE ---------- */
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8EFF6",
    borderStyle: "dashed",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F3FB",
  },

  emptyIconText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F76AE",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "800",
    color: "#16324F",
  },

  emptyText: {
    marginTop: 4,
    textAlign: "center",
    color: "#8697A8",
    fontSize: 12.5,
    fontWeight: "500",
  },

  helperNote: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B2",
    marginTop: 2,
  },
});
