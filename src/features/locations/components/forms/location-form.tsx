"use client"

import { useEffect, useMemo, useState } from "react"
import type { UseFormReturn } from "react-hook-form"

import { DynamicForm } from "@/components/shared/forms/templates"
import { LayoutMode } from "@/components/shared/forms/types"
import { useError } from "@/features/errors"
import { listUsers } from "@/features/users/actions/user-actions"
import {
  buildLocationFormFields,
  type SelectOption,
} from "@/features/locations/components/forms/location-form-fields"
import type { LocationFormValues } from "@/features/locations/types/location-types"

type LocationFormProps = {
  isEdit?: boolean
  initialValues?: Partial<LocationFormValues>
  onSubmit: (
    values: LocationFormValues,
    form: UseFormReturn<LocationFormValues>,
  ) => void | Promise<void>
  submitLabel?: string
  onDirtyChange?: (isDirty: boolean) => void
}

export function LocationForm({
  isEdit = false,
  initialValues,
  onSubmit,
  submitLabel,
  onDirtyChange,
}: LocationFormProps) {
  const { run } = useError()
  const [managerOptions, setManagerOptions] = useState<SelectOption[]>([])
  const [optionsLoaded, setOptionsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const users = await run(listUsers())
      if (cancelled) return
      setManagerOptions(
        (users ?? []).map((user) => ({
          label: user.fullName,
          value: user.id,
        })),
      )
      setOptionsLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [run])

  const fields = useMemo(
    () => buildLocationFormFields(managerOptions),
    [managerOptions],
  )

  if (!optionsLoaded) {
    return (
      <p className="text-sm text-muted-foreground">Loading form options…</p>
    )
  }

  return (
    <DynamicForm<LocationFormValues>
      fields={fields}
      layout={{ mode: LayoutMode.Single, columns: 2 }}
      isEdit={isEdit}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={
        submitLabel ?? (isEdit ? "Save changes" : "Create location")
      }
      onDirtyChange={onDirtyChange}
    />
  )
}
