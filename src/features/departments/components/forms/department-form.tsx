"use client"

import type { UseFormReturn } from "react-hook-form"

import { DynamicForm } from "@/components/shared/forms/templates"
import { LayoutMode } from "@/components/shared/forms/types"
import { departmentFormFields } from "@/features/departments/components/forms/department-form-fields"
import type { DepartmentFormValues } from "@/features/departments/types/department-types"

type DepartmentFormProps = {
  isEdit?: boolean
  initialValues?: Partial<DepartmentFormValues>
  onSubmit: (
    values: DepartmentFormValues,
    form: UseFormReturn<DepartmentFormValues>,
  ) => void | Promise<void>
  submitLabel?: string
  onDirtyChange?: (isDirty: boolean) => void
}

export function DepartmentForm({
  isEdit = false,
  initialValues,
  onSubmit,
  submitLabel,
  onDirtyChange,
}: DepartmentFormProps) {
  return (
    <DynamicForm<DepartmentFormValues>
      fields={departmentFormFields}
      layout={{ mode: LayoutMode.Single, columns: 2 }}
      isEdit={isEdit}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={
        submitLabel ?? (isEdit ? "Save changes" : "Create department")
      }
      onDirtyChange={onDirtyChange}
    />
  )
}
