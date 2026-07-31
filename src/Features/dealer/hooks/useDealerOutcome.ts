import { useEffect } from "react";

import { getDealerOutcomes, saveDealerOutcome } from "../services/dealerOutcome.service";
import { DealerMeetingOutcomeForm } from "../types/dealerOutcome.types";
import { useDealerOutcomeStore } from "../store/dealerOutcome.store";

export function useDealerOutcome(employeeId: string) {
  const { outcomes, loading, saving, setOutcomes, upsertOutcome, setLoading, setSaving } = useDealerOutcomeStore();

  async function loadOutcomes() {
    setLoading(true);

    try {
      const data = await getDealerOutcomes(employeeId);
      setOutcomes(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function save(form: DealerMeetingOutcomeForm) {
    if (saving) {
      return { data: null, isUpdate: false };
    }

    setSaving(true);

    try {
      const result = await saveDealerOutcome(employeeId, form);
      upsertOutcome(result.data);
      return result;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (employeeId) {
      loadOutcomes();
    }
  }, [employeeId]);

  return {
    outcomes,
    loading,
    saving,
    save,
    reload: loadOutcomes,
  };
}