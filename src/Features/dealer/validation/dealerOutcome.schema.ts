import {z} from "zod";

export const DealerMeetingOutcomeSchema=z.object({

    dealer_id:z.string().min(1),

    location:z.string().min(1),

    meeting_date:z.string(),

    outcome:z.string().min(1)

});

export type DealerMeetingOutcomeType=

z.infer<typeof DealerMeetingOutcomeSchema>;