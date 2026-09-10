"use client"

import { useMemo, useState, useEffect } from "react"
import {
  useForm,
  useWatch,
  type ControllerRenderProps,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import type { ZodType } from "zod"

import { dynamicResolver } from "@/components/shared/forms/lib/dynamic-resolver"
import { resolveField } from "@/components/shared/forms/lib/registry"
import type {
  DynamicFormProps,
  FieldDef,
} from "@/components/shared/forms/types"
import { LayoutMode } from "@/components/shared/forms/types"
import { Button } from "@/components/ui/button"
import { Form, FormField } from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function isStaticallyRequired(schema: ZodType): boolean {
  return !schema.safeParse(undefined).success
}

function buildDefaultValues<T extends FieldValues>(
  fields: FieldDef<T>[],
  initialValues?: Partial<T>,
): DefaultValues<T> {
  const defaults = {} as DefaultValues<T>

  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      ;(defaults as Record<string, unknown>)[field.name] = field.defaultValue
    }
  }

  return {
    ...defaults,
    ...(initialValues as DefaultValues<T> | undefined),
  }
}

type RenderedFieldProps<T extends FieldValues> = {
  fieldDef: FieldDef<T>
  disabled: boolean
  required: boolean
}

function RenderedField<T extends FieldValues>({
  fieldDef,
  disabled,
  required,
}: RenderedFieldProps<T>) {
  const resolved = resolveField(fieldDef)

  return (
    <FormField
      name={fieldDef.name}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message

        if (resolved.kind === "custom") {
          return (
            <>
              {resolved.render({
                field: field as ControllerRenderProps<T, FieldPath<T>>,
                fieldDef,
                disabled,
                required,
                error,
              })}
            </>
          )
        }

        const { Component } = resolved
        return (
          <Component
            name={fieldDef.name}
            label={fieldDef.label}
            placeholder={fieldDef.placeholder}
            description={fieldDef.description}
            disabled={disabled}
            required={required}
            error={error}
            field={field as ControllerRenderProps<FieldValues, string>}
            options={fieldDef.options}
          />
        )
      }}
    />
  )
}

function FieldGrid<T extends FieldValues>({
  fields,
  columns,
  isEdit,
  values,
}: {
  fields: FieldDef<T>[]
  columns: 1 | 2
  isEdit: boolean
  values: T
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
      )}
    >
      {fields.map((fieldDef) => {
        if (fieldDef.visibleWhen && !fieldDef.visibleWhen(values)) {
          return null
        }

        const disabled = isEdit && fieldDef.canEdit === false
        const required = fieldDef.requiredWhen
          ? fieldDef.requiredWhen(values)
          : isStaticallyRequired(fieldDef.validation)
        const colSpan = fieldDef.colSpan ?? 1

        return (
          <div
            key={fieldDef.name}
            className={cn(colSpan === 2 && columns === 2 && "md:col-span-2")}
          >
            <RenderedField
              fieldDef={fieldDef}
              disabled={disabled}
              required={required}
            />
          </div>
        )
      })}
    </div>
  )
}

export function DynamicForm<T extends FieldValues>({
  fields,
  layout,
  isEdit = false,
  initialValues,
  onSubmit,
  submitLabel = "Submit",
  onDirtyChange,
  skipClientValidation = false,
}: DynamicFormProps<T>) {
  const visibleFields = useMemo(
    () => fields.filter((field) => !field.hide),
    [fields],
  )

  const defaultValues = useMemo(
    () => buildDefaultValues(fields, initialValues),
    [fields, initialValues],
  )

  const form = useForm<T>({
    resolver: skipClientValidation
      ? async (values) => ({ values: values as T, errors: {} })
      : dynamicResolver(fields),
    defaultValues,
    mode: "onSubmit",
  })

  const { isDirty } = form.formState

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Re-render when conditional fields' source values change.
  const values = (useWatch({ control: form.control }) ?? form.getValues()) as T

  const [currentStep, setCurrentStep] = useState(0)
  const [activeTab, setActiveTab] = useState(
    layout.mode === LayoutMode.Tabs ? layout.tabs[0]?.key : "",
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data, form)
  })

  const renderSubmit = (label = submitLabel) => (
    <Button type="submit" disabled={form.formState.isSubmitting}>
      {label}
    </Button>
  )

  if (layout.mode === LayoutMode.MultiStep) {
    const steps = layout.steps
    const step = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1
    const stepFields = visibleFields.filter(
      (field) => field.section === step?.key,
    )
    const progressValue =
      steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0

    const handleNext = async () => {
      const names = stepFields.map((field) => field.name)
      const valid = await form.trigger(names)
      if (!valid) return
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }

    return (
      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (isLastStep) {
              void handleSubmit()
            }
          }}
          className="space-y-6"
        >
          {layout.showProgressBar ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{step?.label}</span>
                <span className="text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <Progress value={progressValue} />
              {step?.description ? (
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="text-lg font-medium">{step?.label}</h3>
              {step?.description ? (
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              ) : null}
            </div>
          )}

          <FieldGrid
            fields={stepFields}
            columns={1}
            isEdit={isEdit}
            values={values}
          />

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            >
              Back
            </Button>
            {isLastStep ? (
              renderSubmit()
            ) : (
              <Button type="button" onClick={() => void handleNext()}>
                Next
              </Button>
            )}
          </div>
        </form>
      </Form>
    )
  }

  if (layout.mode === LayoutMode.Tabs) {
    const tabs = layout.tabs
    const tabKey = activeTab || tabs[0]?.key || ""

    return (
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={tabKey} onValueChange={setActiveTab}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => {
              const tabFields = visibleFields.filter(
                (field) => field.section === tab.key,
              )
              return (
                <TabsContent key={tab.key} value={tab.key} className="mt-4">
                  <FieldGrid
                    fields={tabFields}
                    columns={1}
                    isEdit={isEdit}
                    values={values}
                  />
                </TabsContent>
              )
            })}
          </Tabs>
          {renderSubmit()}
        </form>
      </Form>
    )
  }

  const columns = layout.columns ?? 1

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldGrid
          fields={visibleFields}
          columns={columns}
          isEdit={isEdit}
          values={values}
        />
        {renderSubmit()}
      </form>
    </Form>
  )
}
