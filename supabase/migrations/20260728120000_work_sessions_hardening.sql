ALTER TABLE public.work_sessions
ALTER COLUMN total_km TYPE numeric USING total_km::numeric;

CREATE UNIQUE INDEX IF NOT EXISTS work_sessions_employee_date_unique
ON public.work_sessions (employee_id, work_date);
