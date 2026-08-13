import {z} from "zod";

export const SaleSchema=z.object({

    doctor_id:z.string().optional(),

    retailer_id:z.string().optional(),

    dealer_id:z.string().min(1),

    product_id:z.string().min(1),

    sale_date:z.string(),

    quantity:z.number().min(1),

    rate:z.number().min(1),

    sale_type:z.enum(["counter","doctor","retailer","farmer"])

}).refine((value) => value.sale_type !== "doctor" || Boolean(value.doctor_id?.trim()), {
    message: "Please select a doctor for doctor sales.",
    path: ["doctor_id"],
}).refine((value) => value.sale_type !== "retailer" || Boolean(value.retailer_id?.trim()), {
    message: "Please select a retailer for retailer sales.",
    path: ["retailer_id"],
});

export type SaleType=

z.infer<typeof SaleSchema>;
