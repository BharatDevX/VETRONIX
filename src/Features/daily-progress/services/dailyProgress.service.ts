import { supabase } from "../../../services/supabase/supabase";

const PARENT_TABLE = "daily_progress";
const CHILD_TABLE = "daily_progress_entries";

async function getTodayReport(employeeId: string) {

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const { data, error } = await supabase
        .from(PARENT_TABLE)
        .select("*")
        .eq("employee_id", employeeId)
        .eq("report_date", today)
        .maybeSingle();

    if (error) throw error;

    return data;
}
async function getTodayWorkSession(employeeId: string) {

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const { data, error } = await supabase
        .from("work_sessions")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("work_date", today)
        .maybeSingle();

    if (error) throw error;

    return data;
}
async function createDraft(employeeId: string) {

    const work =
        await getTodayWorkSession(employeeId);

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const { data, error } = await supabase
        .from(PARENT_TABLE)
        .insert({

            employee_id: employeeId,

            work_session_id: work?.id ?? null,

            report_date: today,

            start_meter: work?.start_meter ?? 0,

            end_meter: work?.end_meter ?? 0,

            total_km: work?.total_km ?? 0,

            status: "draft",

        })
        .select()
        .single();

    if (error) throw error;

    return data;
}

async function loadOrCreateDraft(employeeId: string) {

    let report =
        await getTodayReport(employeeId);

    if (!report) {

        report =
            await createDraft(employeeId);

    }

    return report;
}
async function getCurrentMonthReportsWithEntries(employeeId: string) {
    const start = new Date();
    start.setDate(1);
    const startDate = start.toISOString().split("T")[0];
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const endDate = end.toISOString().split("T")[0];

    const { data: reports, error } = await supabase
        .from(PARENT_TABLE)
        .select("*")
        .eq("employee_id", employeeId)
        .gte("report_date", startDate)
        .lte("report_date", endDate)
        .order("report_date", { ascending: false });

    if (error) throw error;

    const rows = reports ?? [];
    return Promise.all(rows.map(async (report: any) => ({
        ...report,
        entries: await getEntries(report.id),
    })));
}

async function getEntries(
    dailyProgressId: string
) {

    const { data, error } = await supabase

        .from(CHILD_TABLE)

        .select("*")

        .eq(
            "daily_progress_id",
            dailyProgressId
        )

        .order("serial_no");

    if (error) throw error;

    return data ?? [];
}
async function addEntry(entry: any) {

    const { data, error } = await supabase

        .from(CHILD_TABLE)

        .insert(entry)

        .select()

        .single();

    if (error) throw error;

    return data;
}
async function updateEntry(
    id: string,
    values: any
) {

    const { data, error } = await supabase

        .from(CHILD_TABLE)

        .update(values)

        .eq("id", id)

        .select()

        .single();

    if (error) throw error;

    return data;
}
async function deleteEntry(id: string) {

    const { error } = await supabase

        .from(CHILD_TABLE)

        .delete()

        .eq("id", id);

    if (error) throw error;
}
async function saveDraft(
    id: string,
    remarks: string
) {

    const { error } = await supabase

        .from(PARENT_TABLE)

        .update({

            remarks,

            status: "draft",

        })

        .eq("id", id);

    if (error) throw error;
}
async function submitReport(
    id: string
) {

    const { error } = await supabase

        .from(PARENT_TABLE)

        .update({

            status: "submitted",

            submitted_at:
                new Date().toISOString(),

        })

        .eq("id", id);

    if (error) throw error;
}
export const dailyProgressService = {

    getTodayReport,

    getTodayWorkSession,

    createDraft,

    loadOrCreateDraft,

    getEntries,
    getCurrentMonthReportsWithEntries,

    addEntry,

    updateEntry,

    deleteEntry,

    saveDraft,

    submitReport,

};