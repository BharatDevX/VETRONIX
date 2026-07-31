import { z } from "zod";

export const mtpStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export const hqExTourSchema = z.enum([
  "HQ",
  "EX",
  "TOUR",
]);

export const monthlyTourProgrammeSchema = z.object({
  employee_id: z.string().uuid(),

  month: z
    .number()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),

  year: z
    .number()
    .min(2024)
    .max(2100),

  designation: z.string().nullable().optional(),

  hq: z.string().nullable().optional(),

  status: mtpStatusSchema.default("draft"),
});

export const monthlyTourEntrySchema = z.object({
  programme_id: z.string().uuid(),

  tour_date: z.string().min(1, "Date is required"),

  hq_ex_tour: hqExTourSchema,

  route_plan_details: z
    .string()
    .trim()
    .min(1, "Route details are required")
    .max(500),

  total_km: z
    .number()
    .min(0, "KM cannot be negative")
    .max(5000),

  travel_mode: z.string().nullable().optional(),

  total_customer_plan: z
    .number()
    .int()
    .min(0, "Customer count cannot be negative")
    .max(500),

  route_no: z.string().nullable().optional(),

  sequence_no: z
    .number()
    .int()
    .min(1),
});

export type MonthlyTourProgrammeInput =
  z.infer<typeof monthlyTourProgrammeSchema>;

export type MonthlyTourEntryInput =
  z.infer<typeof monthlyTourEntrySchema>;