"use client"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DateInput({
  label,
  placeholder,
  description,
  disabled,
  required,
  field,
}: FieldComponentProps) {
  const value = field.value instanceof Date ? field.value : undefined

  return (
    <FormItem className="flex flex-col">
      <FormLabel>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full pl-3 text-left font-normal",
                !value && "text-muted-foreground",
              )}
            >
              {value ? format(value, "PPP") : (placeholder ?? "Pick a date")}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => field.onChange(date)}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <FormMessage />
    </FormItem>
  )
}
