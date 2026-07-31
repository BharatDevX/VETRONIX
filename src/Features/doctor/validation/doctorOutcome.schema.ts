    import { z } from "zod";

export const DoctorMeetingOutcomeSchema = z.object({

    doctor_id: z.string().min(1,"Doctor is required"),

    area: z.string().min(1,"Area is required"),

    agreed_percentage: z
        .number()
        .min(0)
        .max(100),

    product_ids: z
        .array(z.string())
        .min(1,"Select at least one medicine")

});

export type DoctorMeetingOutcomeType =
z.infer<typeof DoctorMeetingOutcomeSchema>;