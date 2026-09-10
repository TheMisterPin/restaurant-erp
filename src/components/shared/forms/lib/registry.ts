import type { ComponentType, ReactNode } from "react"
import type { FieldValues } from "react-hook-form"

import {
  CheckboxInput,
  DateInput,
  EmailInput,
  MultiselectInput,
  NumberInput,
  PasswordInput,
  RadioInput,
  SelectInput,
  SwitchInput,
  TextInput,
  TextareaInput,
} from "@/components/shared/forms/inputs"
import type {
  FieldComponentProps,
  FieldDef,
  FieldRenderProps,
  FieldType,
} from "@/components/shared/forms/types"

export const fieldRegistry: Record<
  FieldType,
  ComponentType<FieldComponentProps>
> = {
  text: TextInput,
  textarea: TextareaInput,
  number: NumberInput,
  email: EmailInput,
  password: PasswordInput,
  select: SelectInput,
  multiselect: MultiselectInput,
  checkbox: CheckboxInput,
  radio: RadioInput,
  date: DateInput,
  switch: SwitchInput,
}

export function resolveField<T extends FieldValues>(
  fieldDef: FieldDef<T>,
):
  | { kind: "custom"; render: (props: FieldRenderProps<T>) => ReactNode }
  | { kind: "registry"; Component: ComponentType<FieldComponentProps> } {
  if (fieldDef.render) {
    return { kind: "custom", render: fieldDef.render }
  }

  const Component = fieldRegistry[fieldDef.type]
  if (!Component) {
    throw new Error(
      `[DynamicForm] No field component registered for type "${fieldDef.type}".`,
    )
  }

  return { kind: "registry", Component }
}
