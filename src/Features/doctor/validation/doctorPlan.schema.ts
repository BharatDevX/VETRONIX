import { z } from "zod";

export const DoctorMeetingPlanSchema = z.object({

    doctor_id: z.string().min(1),

    location: z.string().min(1),

    planned_date: z.string(),

    discussion: z.string().min(1),

    reply: z.string().max(1000).optional(),

    product_ids: z.array(z.string())

});

export type DoctorMeetingPlanType =
z.infer<typeof DoctorMeetingPlanSchema>;
