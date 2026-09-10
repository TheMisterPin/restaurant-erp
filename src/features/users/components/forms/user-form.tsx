"use client"

import { useEffect, useMemo, useState } from "react"
import type { UseFormReturn } from "react-hook-form"

import { DynamicForm } from "@/components/shared/forms/templates"
import { LayoutMode } from "@/components/shared/forms/types"
import { listDepartments } from "@/features/departments/actions/department-actions"
import { useError } from "@/features/errors"
import { listLocations } from "@/features/locations/actions/location-actions"
import {
  buildCreateUserFormFields,
  buildEditUserFormFields,
  type SelectOption,
} from "@/features/users/components/forms/user-form-fields"
import type { UserFormValues } from "@/features/users/types/user-types"

type UserFormProps = {
  isEdit?: boolean
  initialValues?: Partial<UserFormValues>
  onSubmit: (
    values: UserFormValues,
    form: UseFormReturn<UserFormValues>,
  ) => void | Promise<void>
  submitLabel?: string
  onDirtyChange?: (isDirty: boolean) => void
}

export function UserForm({
  isEdit = false,
  initialValues,
  onSubmit,
  submitLabel,
  onDirtyChange,
}: UserFormProps) {
  const { run } = useError()
  const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>(
    [],
  )
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([])
  const [optionsLoaded, setOptionsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [departments, locations] = await Promise.all([
        run(listDepartments()),
        run(listLocations()),
      ])
      if (cancelled) return
      setDepartmentOptions(
        (departments ?? []).map((department) => ({
          label: department.name,
          value: department.id,
        })),
      )
      setLocationOptions(
        (locations ?? []).map((location) => ({
          label: location.name,
          value: location.id,
        })),
      )
      setOptionsLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [run])

  const fields = useMemo(() => {
    const options = { departmentOptions, locationOptions }
    return isEdit
      ? buildEditUserFormFields(options)
      : buildCreateUserFormFields(options)
  }, [departmentOptions, isEdit, locationOptions])

  if (!optionsLoaded) {
    return (
      <p className="text-sm text-muted-foreground">Loading form options…</p>
    )
  }

  return (
    <DynamicForm<UserFormValues>
      fields={fields}
      layout={{ mode: LayoutMode.Single, columns: 2 }}
      isEdit={isEdit}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={submitLabel ?? (isEdit ? "Save changes" : "Create user")}
      onDirtyChange={onDirtyChange}
    />
  )
}
