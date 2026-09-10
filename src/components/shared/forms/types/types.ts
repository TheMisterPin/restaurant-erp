import type { ReactNode } from "react"
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from "react-hook-form"
import type { ZodType } from "zod"

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "date"
  | "switch"

export type FieldOption = {
  label: string
  value: string
}

export type FieldRenderProps<T extends FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>
  fieldDef: FieldDef<T>
  disabled: boolean
  required: boolean
  error: string | undefined
}

export type FieldDef<T extends FieldValues> = {
  name: FieldPath<T>
  type: FieldType
  label: string
  placeholder?: string
  description?: string
  validation: ZodType
  defaultValue?: PathValue<T, FieldPath<T>>
  visibleWhen?: (values: T) => boolean
  requiredWhen?: (values: T) => boolean
  canEdit?: boolean
  hide?: boolean
  options?: FieldOption[]
  render?: (props: FieldRenderProps<T>) => ReactNode
  colSpan?: 1 | 2
  section?: string
}

export type FieldComponentProps = {
  name: string
  label: string
  placeholder?: string
  description?: string
  disabled?: boolean
  required?: boolean
  error?: string
  field: ControllerRenderProps<FieldValues, string>
  options?: FieldOption[]
}

export enum LayoutMode {
  Single = "single",
  MultiStep = "multi-step",
  Tabs = "tabs",
}

export type SingleLayoutConfig = {
  mode: LayoutMode.Single
  columns?: 1 | 2
}

export type MultiStepLayoutConfig = {
  mode: LayoutMode.MultiStep
  steps: Array<{
    key: string
    label: string
    description?: string
  }>
  showProgressBar?: boolean
}

export type TabsLayoutConfig = {
  mode: LayoutMode.Tabs
  tabs: Array<{
    key: string
    label: string
    icon?: ReactNode
  }>
}

export type LayoutConfig =
  | SingleLayoutConfig
  | MultiStepLayoutConfig
  | TabsLayoutConfig

export type DynamicFormProps<T extends FieldValues> = {
  fields: FieldDef<T>[]
  layout: LayoutConfig
  isEdit?: boolean
  initialValues?: Partial<T>
  onSubmit: (values: T, form: UseFormReturn<T>) => void | Promise<void>
  submitLabel?: string
  onDirtyChange?: (isDirty: boolean) => void
  /** Demo/testing only — skip RHF resolver so server Zod errors can surface inline */
  skipClientValidation?: boolean
}
