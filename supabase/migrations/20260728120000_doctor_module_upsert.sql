create unique index if not exists doctor_meeting_plans_employee_doctor_date_key
on public.doctor_meeting_plans (employee_id, doctor_id, planned_date);

create unique index if not exists doctor_meeting_outcomes_employee_doctor_month_year_area_key
on public.doctor_meeting_outcomes (employee_id, doctor_id, month, year, area);

create unique index if not exists doctor_visits_employee_doctor_date_time_key
on public.doctor_visits (employee_id, doctor_id, visit_date, visit_time);

create unique index if not exists doctor_meeting_plan_products_plan_id_product_id_key
on public.doctor_meeting_plan_products (plan_id, product_id);

create unique index if not exists doctor_visit_products_visit_id_product_id_key
on public.doctor_visit_products (visit_id, product_id);

create unique index if not exists doctor_meeting_outcome_products_outcome_id_product_id_key
on public.doctor_meeting_outcome_products (outcome_id, product_id);
