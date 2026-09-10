"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { FieldShell } from "./field-shell"

export function SelectInput({
  label,
  placeholder,
  description,
  disabled,
  required,
  field,
  options = [],
}: FieldComponentProps) {
  return (
    <FieldShell label={label} description={description} required={required}>
      <Select
        disabled={disabled}
        value={
          field.value === undefined || field.value === null || field.value === ""
            ? undefined
            : String(field.value)
        }
        onValueChange={field.onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder ?? "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}
