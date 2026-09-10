import { z } from "zod"

/** Shared field validators — used by FieldDefs and the server schema. */

export const departmentNameSchema = z.string().min(1, "Required")

export const departmentDescriptionSchema = z.string().optional()

export const departmentIsActiveSchema = z.boolean().optional()

/** Create department payload. */
export const createDepartmentSchema = z.object({
  name: departmentNameSchema,
  description: departmentDescriptionSchema,
  isActive: departmentIsActiveSchema,
})

/** Update department payload. */
export const updateDepartmentSchema = z.object({
  id: z.string().uuid("Invalid department id"),
  name: departmentNameSchema,
  description: departmentDescriptionSchema,
  isActive: departmentIsActiveSchema,
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>
