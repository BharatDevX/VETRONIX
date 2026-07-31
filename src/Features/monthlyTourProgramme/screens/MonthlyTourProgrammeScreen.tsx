import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FAB,
  Searchbar,
  SegmentedButtons,
  Button,
} from "react-native-paper";

import { useAuthStore } from "../../auth/store/auth.store";

import { useMonthlyTourProgramme } from "../../monthlyTourProgramme/hooks/useMonthlTourProgramme";

import TourHeader from "../components/TourHeader";
import SummaryCard from "../components/SummaryCard";
import EmptyState from "../components/EmptyState";
import TourEntryCard from "../components/TourEntryCard";
import TourEntryForm from "../components/TourEntryForm";

import { MonthlyTourEntry } from "../types/monthlyTourProgramme.types";

export default function MonthlyTourProgrammeScreen() {
  const { employee } = useAuthStore();

  const {
    programme,
    entries,
    summary,
    loading,
    refresh,
    add,
    update,
    remove,
    submit,
    canEdit,
  } = useMonthlyTourProgramme();

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "ALL" | "HQ" | "EX" | "TOUR"
  >("ALL");

  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingEntry, setEditingEntry] =
    useState<MonthlyTourEntry | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!employee) return;

    refresh(
      employee.id,
      currentMonth,
      currentYear
    );
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.route_plan_details
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL"
          ? true
          : entry.hq_ex_tour === filter;

      return matchesSearch && matchesFilter;
    });
  }, [entries, search, filter]);

  const onRefresh = async () => {
    if (!employee) return;

    setRefreshing(true);

    await refresh(
      employee.id,
      currentMonth,
      currentYear
    );

    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={styles.content}
      >
        <TourHeader
          programme={programme}
          employeeName={employee?.full_name ?? ""}
        />

        <SummaryCard summary={summary} />

        <Searchbar
          placeholder="Search Route..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <SegmentedButtons
          value={filter}
          onValueChange={(v) =>
            setFilter(v as any)
          }
          buttons={[
            {
              value: "ALL",
              label: "All",
            },
            {
              value: "HQ",
              label: "HQ",
            },
            {
              value: "EX",
              label: "EX",
            },
            {
              value: "TOUR",
              label: "Tour",
            },
          ]}
        />

       {filteredEntries.length === 0 ? (
  <EmptyState
    onAddTour={() => {
      setEditingEntry(null);
      setModalVisible(true);
    }}
  />
) : (
  <>
    {filteredEntries.map((entry) => (
      <TourEntryCard
        key={entry.id}
        entry={entry}
        editable={canEdit}
        onEdit={(tour) => {
          setEditingEntry(tour);
          setModalVisible(true);
        }}
        onDelete={remove}
      />
    ))}

    {programme?.status === "draft" && (
      <Button
        mode="contained"
        icon="send"
        style={styles.submitButton}
        onPress={submit}
      >
        Submit Monthly Programme
      </Button>
    )}

    <Button
      mode="outlined"
      icon="file-pdf-box"
      style={styles.pdfButton}
      onPress={() => {
        // TODO:
        // Generate PDF
      }}
    >
      Generate PDF
    </Button>
  </>
)}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          setEditingEntry(null);
          setModalVisible(true);
        }}
      />
      <TourEntryForm
  visible={modalVisible}
  entry={editingEntry}
  onClose={() => {
    setModalVisible(false);
    setEditingEntry(null);
  }}
  onSave={async (data) => {
    if (!programme) return;

    if (editingEntry) {
      await update(editingEntry.id, data);
    } else {
      await add({
        programme_id: programme.id,
        sequence_no: entries.length + 1,
        ...data,
      });
    }

    setModalVisible(false);
    setEditingEntry(null);
  }}
/>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 120,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  search: {
    marginVertical: 16,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  submitButton: {
  marginTop: 20,
  borderRadius: 12,
},

pdfButton: {
  marginTop: 12,
  marginBottom: 30,
  borderRadius: 12,
},
});