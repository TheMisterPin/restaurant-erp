"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useModal } from "@/components/shared/modals"
import { Actions, can } from "@/features/auth/permissions"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useError } from "@/features/errors"
import type { ActionResult } from "@/features/errors/dto"
import { fohAlertsFromDiff } from "@/features/restaurant/domain/lifecycle"
import { AddItemsForm } from "@/features/restaurant/components/add-items-form"
import {
  addOrderItems,
  clearTable,
  completePayment,
  deliverCourse,
  fireNextCourse,
  getFloorSnapshot,
  pickupDrinks,
  pickupKitchen,
  requestBill,
} from "@/features/restaurant/actions/service-actions"
import type { FloorPageProps } from "@/features/restaurant/components/pages/floor-page"
import type { CatalogItemKind } from "@/features/restaurant/domain/types"
import type { FloorSnapshot } from "@/features/restaurant/types/service-types"

export function useFloorPage(): FloorPageProps {
  const { run } = useError()
  const { me } = useAuth()
  const { openModal, closeModal, confirm } = useModal()
  const [snapshot, setSnapshot] = useState<FloorSnapshot | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const previousRef = useRef<FloorSnapshot | null>(null)
  const canWrite = me ? can(me.role, Actions.floor.write) : false

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!me || !can(me.role, Actions.floor.read)) return
      const data = await run(getFloorSnapshot())
      if (!data) return
      if (previousRef.current && opts?.silent) {
        const alerts = fohAlertsFromDiff({
          prevCourses: previousRef.current.tables.flatMap((table) =>
            (table.order?.courses ?? []).map((course) => ({
              tableNumber: table.number,
              courseId: course.id,
              courseName: course.name,
              kitchenState: course.kitchenState,
            })),
          ),
          nextCourses: data.tables.flatMap((table) =>
            (table.order?.courses ?? []).map((course) => ({
              tableNumber: table.number,
              courseId: course.id,
              courseName: course.name,
              kitchenState: course.kitchenState,
            })),
          ),
          prevBars: previousRef.current.tables.map((table) => ({
            tableNumber: table.number,
            tableId: table.id,
            barState: table.barState,
          })),
          nextBars: data.tables.map((table) => ({
            tableNumber: table.number,
            tableId: table.id,
            barState: table.barState,
          })),
        })
        for (const alert of alerts) {
          toast.message(alert.message)
        }
      }
      previousRef.current = data
      setSnapshot(data)
      setLoaded(true)
    },
    [me, run],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!me || !can(me.role, Actions.floor.read)) return
      const data = await run(getFloorSnapshot())
      if (cancelled || !data) return
      previousRef.current = data
      setSnapshot(data)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [me, run])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load({ silent: true })
    }, 2000)
    return () => window.clearInterval(timer)
  }, [load])

  const selectedTable = useMemo(
    () => snapshot?.tables.find((table) => table.id === selectedTableId) ?? null,
    [snapshot, selectedTableId],
  )

  const mutate = useCallback(
    async (action: Promise<ActionResult<unknown>>, success: string) => {
      const result = await run(action)
      if (!result) return
      toast.success(success)
      await load({ silent: true })
    },
    [load, run],
  )

  const onAddItems = useCallback(
    (kind: CatalogItemKind) => {
      if (!selectedTable?.order || !snapshot) return
      let formId = ""
      formId = openModal({
        type: "form",
        title: kind === "FOOD" ? "Add food" : "Add drinks",
        size: "md",
        component: (
          <AddItemsForm
            kind={kind}
            catalog={snapshot.catalog}
            courses={selectedTable.order.courses}
            onCancel={() => closeModal(formId)}
            onSubmit={async (values) => {
              const data = await run(
                addOrderItems({
                  tableId: selectedTable.id,
                  catalogItemIds: values.catalogItemIds,
                  courseId: values.courseId,
                }),
              )
              if (!data) return
              toast.success(kind === "FOOD" ? "Food added" : "Drinks added")
              closeModal(formId)
              await load({ silent: true })
            }}
          />
        ),
      })
    },
    [closeModal, load, openModal, run, selectedTable, snapshot],
  )

  return {
    loaded,
    canWrite,
    tables: snapshot?.tables ?? [],
    selectedTable,
    now: snapshot?.now ?? new Date().toISOString(),
    onSelectTable: setSelectedTableId,
    onFireNextCourse: () => {
      if (!selectedTable) return
      void mutate(fireNextCourse({ tableId: selectedTable.id }), "Course fired")
    },
    onAddFood: () => onAddItems("FOOD"),
    onAddDrinks: () => onAddItems("DRINK"),
    onPickupKitchen: () => {
      if (!selectedTable) return
      void mutate(
        pickupKitchen({ tableId: selectedTable.id }),
        "Kitchen course picked up",
      )
    },
    onPickupDrinks: () => {
      if (!selectedTable) return
      void mutate(
        pickupDrinks({ tableId: selectedTable.id }),
        "Drinks picked up",
      )
    },
    onDeliverCourse: () => {
      if (!selectedTable) return
      void mutate(
        deliverCourse({ tableId: selectedTable.id }),
        "Course delivered",
      )
    },
    onPrintBill: () => {
      if (!selectedTable) return
      void mutate(requestBill({ tableId: selectedTable.id }), "Bill requested")
    },
    onTakePayment: async () => {
      if (!selectedTable) return
      const ok = await confirm({
        title: "Record payment?",
        message: `Mark Table ${selectedTable.number} as paid. This cannot be undone from the floor.`,
        confirmLabel: "Take payment",
      })
      if (!ok) return
      await mutate(
        completePayment({ tableId: selectedTable.id }),
        "Payment recorded",
      )
    },
    onClearTable: async () => {
      if (!selectedTable) return
      const ok = await confirm({
        title: "Clear this table?",
        message: `Table ${selectedTable.number} will become available.`,
        confirmLabel: "Clear table",
      })
      if (!ok) return
      await mutate(clearTable({ tableId: selectedTable.id }), "Table cleared")
      setSelectedTableId(null)
    },
  }
}
