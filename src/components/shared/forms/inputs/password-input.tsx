"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import { Input } from "@/components/ui/input"

import { FieldShell } from "./field-shell"

export function PasswordInput({
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
        type="password"
        placeholder={placeholder}
        disabled={disabled}
        {...field}
        value={(field.value as string | undefined) ?? ""}
      />
    </FieldShell>
  )
}
