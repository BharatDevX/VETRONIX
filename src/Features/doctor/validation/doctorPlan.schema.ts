import { z } from "zod";

export const DoctorMeetingPlanSchema = z.object({

    doctor_id: z.string().min(1),

    location: z.string().min(1),

    planned_date: z.string(),

    meeting_date: z.string(),

    discussion: z.string().min(1),

    agreed_percentage: z
        .number()
        .min(0)
        .max(100),

    product_ids: z.array(z.string())

});

export type DoctorMeetingPlanType =
z.infer<typeof DoctorMeetingPlanSchema>;