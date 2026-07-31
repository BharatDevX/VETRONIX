import {z} from "zod";

export const SaleSchema=z.object({

    doctor_id:z.string().optional(),

    dealer_id:z.string().min(1),

    product_id:z.string().min(1),

    sale_date:z.string(),

    quantity:z.number().min(1),

    rate:z.number().min(1),

    sale_type:z.enum(["counter","doctor"])

});

export type SaleType=

z.infer<typeof SaleSchema>;