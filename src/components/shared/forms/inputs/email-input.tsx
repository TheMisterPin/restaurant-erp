"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import { Input } from "@/components/ui/input"

import { FieldShell } from "./field-shell"

export function EmailInput({
  label,
  placeholder,
  description,
  disabled,
  required,
  field,
}: FieldComponentProps) {
  return (
    <FieldShell label={label} description={description} required={required}>
      <Input
        type="email"
        placeholder={placeholder}
        disabled={disabled}
        {...field}
        value={(field.value as string | undefined) ?? ""}
      />
    </FieldShell>
  )
}
