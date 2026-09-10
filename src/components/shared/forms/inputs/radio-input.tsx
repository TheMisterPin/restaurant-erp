"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function RadioInput({
  label,
  description,
  disabled,
  required,
  field,
  options = [],
}: FieldComponentProps) {
  return (
    <FormItem>
      <FormLabel>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </FormLabel>
      <FormControl>
        <RadioGroup
          disabled={disabled}
          value={(field.value as string | undefined) ?? ""}
          onValueChange={field.onChange}
          className="flex flex-col gap-2"
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
              <Label htmlFor={`${field.name}-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FormControl>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <FormMessage />
    </FormItem>
  )
}
