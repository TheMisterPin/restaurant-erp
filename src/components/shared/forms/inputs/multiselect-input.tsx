"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"

export function MultiselectInput({
  label,
  description,
  disabled,
  required,
  field,
  options = [],
}: FieldComponentProps) {
  const selected = Array.isArray(field.value)
    ? (field.value as string[])
    : []

  return (
    <FormItem>
      <FormLabel>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </FormLabel>
      <div className="space-y-2">
        {options.map((option) => {
          const checked = selected.includes(option.value)
          return (
            <div key={option.value} className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  disabled={disabled}
                  checked={checked}
                  onCheckedChange={(next) => {
                    const isChecked = next === true
                    const updated = isChecked
                      ? [...selected, option.value]
                      : selected.filter((value) => value !== option.value)
                    field.onChange(updated)
                  }}
                />
              </FormControl>
              <Label className="font-normal">{option.label}</Label>
            </div>
          )
        })}
      </div>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <FormMessage />
    </FormItem>
  )
}
