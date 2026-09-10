import type {
  FieldErrors,
  FieldValues,
  Resolver,
  ResolverResult,
} from "react-hook-form"
import type { ZodIssue } from "zod"

import type { FieldDef } from "@/components/shared/forms/types"

import { buildValidationSchema } from "./build-validation-schema"

function setNestedError(
  errors: Record<string, unknown>,
  path: (string | number)[],
  message: string,
): void {
  if (path.length === 0) return

  const [head, ...rest] = path
  const key = String(head)

  if (rest.length === 0) {
    errors[key] = { type: "validation", message }
    return
  }

  const existing = errors[key]
  const nested =
    existing && typeof existing === "object" && !("message" in existing)
      ? (existing as Record<string, unknown>)
      : {}

  errors[key] = nested
  setNestedError(nested, rest, message)
}

function zodIssuesToFieldErrors<T extends FieldValues>(
  issues: ZodIssue[],
): FieldErrors<T> {
  const errors: Record<string, unknown> = {}

  for (const issue of issues) {
    setNestedError(errors, issue.path, issue.message)
  }

  return errors as FieldErrors<T>
}

export function dynamicResolver<T extends FieldValues>(
  fields: FieldDef<T>[],
): Resolver<T> {
  return async (values): Promise<ResolverResult<T>> => {
    const schema = buildValidationSchema(fields, values)
    const result = schema.safeParse(values)

    if (result.success) {
      return {
        values: result.data as T,
        errors: {},
      }
    }

    return {
      values: {},
      errors: zodIssuesToFieldErrors<T>(result.error.issues),
    }
  }
}
