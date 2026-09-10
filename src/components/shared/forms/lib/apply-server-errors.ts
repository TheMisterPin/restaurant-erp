import type {
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form"

/**
 * Maps server ErrorDTO.fieldErrors onto react-hook-form via setError.
 * Uses the first message per field.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldErrors: Record<string, string[]>,
): void {
  for (const [name, messages] of Object.entries(fieldErrors)) {
    const message = messages[0]
    if (!message) continue
    form.setError(name as FieldPath<T>, {
      type: "server",
      message,
    })
  }
}
