"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { CatalogItemKind, CatalogOption } from "@/features/restaurant/domain/types"
import type { ServiceCourseDTO } from "@/features/restaurant/types/service-types"

export function AddItemsForm({
  kind,
  catalog,
  courses,
  onCancel,
  onSubmit,
}: {
  kind: CatalogItemKind
  catalog: CatalogOption[]
  courses: ServiceCourseDTO[]
  onCancel: () => void
  onSubmit: (input: {
    catalogItemIds: string[]
    courseId: string | null
  }) => Promise<void>
}) {
  const options = useMemo(
    () => catalog.filter((item) => item.kind === kind),
    [catalog, kind],
  )
  const assignableCourses = courses.filter((course) => !course.deliveredAt)
  const [selected, setSelected] = useState<string[]>([])
  const [courseId, setCourseId] = useState<string>("")
  const [pending, setPending] = useState(false)

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault()
        if (selected.length === 0) return
        setPending(true)
        try {
          await onSubmit({
            catalogItemIds: selected,
            courseId: courseId || null,
          })
        } finally {
          setPending(false)
        }
      }}
    >
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {options.map((item) => (
          <li key={item.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2">
              <Checkbox
                checked={selected.includes(item.id)}
                onCheckedChange={() => toggle(item.id)}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </label>
          </li>
        ))}
      </ul>
      {assignableCourses.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="assign-course">Assign to course (optional)</Label>
          <select
            id="assign-course"
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="">Immediate preparation</option>
            {assignableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
                {course.firedAt ? "" : " — not fired"}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || selected.length === 0}>
          Confirm
        </Button>
      </div>
    </form>
  )
}
