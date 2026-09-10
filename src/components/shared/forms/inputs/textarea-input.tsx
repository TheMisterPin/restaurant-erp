"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import { Textarea } from "@/components/ui/textarea"

import { FieldShell } from "./field-shell"

export function TextareaInput({
  label,
  placeholder,
  description,
  disabled,
  required,
  field,
}: FieldComponentProps) {
  return (
    <FieldShell label={label} description={description} required={required}>
      <Textarea
        placeholder={placeholder}
        disabled={disabled}
        {...field}
        value={(field.value as string | undefined) ?? ""}
      />
    </FieldShell>
  )
}
