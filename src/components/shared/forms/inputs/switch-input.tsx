"use client"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"

export function SwitchInput({
  label,
  description,
  disabled,
  required,
  field,
}: FieldComponentProps) {
  return (
    <FormItem className="flex flex-row items-center justify-between gap-4 rounded-md border p-3">
      <div className="space-y-0.5">
        <FormLabel>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </FormLabel>
        {description ? <FormDescription>{description}</FormDescription> : null}
        <FormMessage />
      </div>
      <FormControl>
        <Switch
          disabled={disabled}
          checked={Boolean(field.value)}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )
}
