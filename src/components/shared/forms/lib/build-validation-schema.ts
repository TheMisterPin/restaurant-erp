import type { FieldValues } from "react-hook-form"
import { z } from "zod"

import type { FieldDef } from "@/components/shared/forms/types"

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === "string" && value.trim() === "") return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

export function buildValidationSchema<T extends FieldValues>(
  fields: FieldDef<T>[],
  values: T,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    if (field.hide) continue
    if (field.visibleWhen && !field.visibleWhen(values)) continue

    let schema = field.validation

    if (field.requiredWhen?.(values)) {
      schema = schema.superRefine((value, ctx) => {
        if (isEmptyValue(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Required",
          })
        }
      })
    }

    shape[field.name] = schema
  }

  return z.object(shape)
}
