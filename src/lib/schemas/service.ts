import { z } from "zod"

export const catalogItemKindSchema = z.enum(["FOOD", "DRINK"])

export const addOrderItemsSchema = z.object({
  tableId: z.string().uuid("Invalid table id"),
  catalogItemIds: z
    .array(z.string().uuid("Invalid catalog item id"))
    .min(1, "Select at least one item"),
  courseId: z.string().uuid("Invalid course id").nullable().optional(),
})

export const tableIdSchema = z.object({
  tableId: z.string().uuid("Invalid table id"),
})

export const itemIdSchema = z.object({
  itemId: z.string().uuid("Invalid item id"),
})

export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>
