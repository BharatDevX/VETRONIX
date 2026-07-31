import { useEffect } from "react";

import { getDoctorOutcomes, saveDoctorOutcome } from "../services/doctorOutcome.service";
import { DoctorMeetingOutcomeForm } from "../types/doctorOutcome.types";
import { useDoctorOutcomeStore } from "../store/doctorOutcome.store";

export function useDoctorOutcome(employeeId: string) {
  const { outcomes, loading, saving, setLoading, setOutcomes, upsertOutcome, setSaving } = useDoctorOutcomeStore();

  async function loadOutcomes() {
    setLoading(true);

    try {
      const data = await getDoctorOutcomes(employeeId);
      setOutcomes(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function save(form: DoctorMeetingOutcomeForm) {
    setSaving(true);

    try {
      const result = await saveDoctorOutcome(employeeId, form);
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