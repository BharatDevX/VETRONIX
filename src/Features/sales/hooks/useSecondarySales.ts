import { useCallback, useEffect, useState } from "react";
import {
  getSecondarySales,
  hasSubmittedSecondarySales,
} from "../services/secondarySales.service";
import { useSecondarySalesStore } from "../store/secondarySales.store";

export function useSecondarySales(employeeId: string, saleDate?: string) {
  const { reports, loading, setReports, setLoading } = useSecondarySalesStore();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) {
      setReports([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSecondarySales(employeeId, saleDate);
      setReports(data ?? []);
    } catch (error) {
      console.error("Failed to load secondary sales", error);
      setReports([]);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load the secondary sales report right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId, saleDate, setLoading, setReports]);

  useEffect(() => {
    load();
  }, [load]);

  return { reports, loading, error, reload: load };
}

export function useSecondarySalesSubmission(employeeId: string) {
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    if (!employeeId) {
      setSubmitted(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      setSubmitted(await hasSubmittedSecondarySales(employeeId));
    } catch (error) {
      console.error("Failed to check secondary sales submission", error);
      setSubmitted(false);
    } finally {
      setChecking(false);
    }
  }, [employeeId]);

  useEffect(() => {
    check();
  }, [check]);

  return { submitted, checking, reload: check };
}
