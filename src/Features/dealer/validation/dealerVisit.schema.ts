import { z } from "zod";

export const DealerVisitSchema = z.object({

    dealer_id: z.string().min(1),

    visit_date: z.string(),

    visit_time: z.string(),

    location: z.string().min(1),
    vehicle_type: z.string().min(1),

    discussion: z.string().min(1),

    outcome: z.string().min(1),

    product_ids: z.array(z.string()),

    next_followup_date: z.string()

});

export type DealerVisitType =
z.infer<typeof DealerVisitSchema>;