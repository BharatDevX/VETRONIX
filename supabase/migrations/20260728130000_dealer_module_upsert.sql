create unique index if not exists dealer_meeting_plans_employee_dealer_planned_date_key
on public.dealer_meeting_plans (employee_id, dealer_id, planned_date);

create unique index if not exists dealer_visits_employee_dealer_visit_date_key
on public.dealer_visits (employee_id, dealer_id, visit_date);

create unique index if not exists dealer_meeting_outcomes_employee_dealer_month_year_key
on public.dealer_meeting_outcomes (employee_id, dealer_id, month, year);
