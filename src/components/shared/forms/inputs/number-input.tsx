"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import { Input } from "@/components/ui/input"

import { FieldShell } from "./field-shell"

export function NumberInput({
  label,
  placeholder,
  description,
  disabled,
  required,
  field,
}: FieldComponentProps) {
  const { value, onChange, onBlur, name, ref } = field

  return (
    <FieldShell label={label} description={description} required={required}>
      <Input
        type="number"
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        ref={ref}
        onBlur={onBlur}
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(event) => {
          const next = event.target.value
          onChange(next === "" ? undefined : Number(next))
        }}
      />
    </FieldShell>
  )
}
