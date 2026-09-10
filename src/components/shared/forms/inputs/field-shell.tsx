import type { ReactNode } from "react"

import type { FieldComponentProps } from "@/components/shared/forms/types"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

type FieldShellProps = Pick<
  FieldComponentProps,
  "label" | "description" | "required"
> & {
  children: ReactNode
}

export function FieldShell({
  label,
  description,
  required,
  children,
}: FieldShellProps) {
  return (
    <FormItem>
      <FormLabel>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </FormLabel>
      <FormControl>{children}</FormControl>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <FormMessage />
    </FormItem>
  )
}
