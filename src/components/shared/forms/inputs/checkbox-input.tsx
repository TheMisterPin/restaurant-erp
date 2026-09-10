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

export function CheckboxInput({
  label,
  description,
  disabled,
  required,
  field,
}: FieldComponentProps) {
  return (
    <FormItem className="flex flex-row items-start gap-3 space-y-0">
      <FormControl>
        <Checkbox
          disabled={disabled}
          checked={Boolean(field.value)}
          onCheckedChange={(checked) => field.onChange(checked === true)}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </FormLabel>
        {description ? <FormDescription>{description}</FormDescription> : null}
        <FormMessage />
      </div>
    </FormItem>
  )
}
