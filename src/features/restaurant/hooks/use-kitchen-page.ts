"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Actions, can } from "@/features/auth/permissions"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useError } from "@/features/errors"
import {
  getKitchenSnapshot,
  markKitchenItemReady,
  startKitchenItem,
  undoKitchenItemReady,
} from "@/features/restaurant/actions/service-actions"
import type { KitchenPageProps } from "@/features/restaurant/components/pages/kitchen-page"
import type { KitchenSnapshot } from "@/features/restaurant/types/service-types"

export function useKitchenPage(): KitchenPageProps {
  const { run } = useError()
  const { me } = useAuth()
  const [snapshot, setSnapshot] = useState<KitchenSnapshot | null>(null)
  const [loaded, setLoaded] = useState(false)
  const canWrite = me ? can(me.role, Actions.kitchen.write) : false

  const load = useCallback(async () => {
    if (!me || !can(me.role, Actions.kitchen.read)) return
    const data = await run(getKitchenSnapshot())
    if (!data) return
    setSnapshot(data)
    setLoaded(true)
  }, [me, run])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!me || !can(me.role, Actions.kitchen.read)) return
      const data = await run(getKitchenSnapshot())
      if (cancelled || !data) return
      setSnapshot(data)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [me, run])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load()
    }, 2000)
    return () => window.clearInterval(timer)
  }, [load])

  const patchItem = (itemId: string, status: "PREPARING" | "READY" | "QUEUED") => {
    setSnapshot((current) => {
      if (!current) return current
      return {
        ...current,
        tables: current.tables.map((table) => ({
          ...table,
          courses: table.courses.map((course) => ({
            ...course,
            items: course.items.map((item) =>
              item.id === itemId
                ? { ...item, productionStatus: status }
                : item,
            ),
          })),
        })),
      }
    })
  }

  return {
    loaded,
    canWrite,
    tables: snapshot?.tables ?? [],
    now: snapshot?.now ?? new Date().toISOString(),
    onStart: async (itemId: string) => {
      patchItem(itemId, "PREPARING")
      const result = await run(startKitchenItem({ itemId }))
      if (!result) {
        await load()
        return
      }
      await load()
    },
    onReady: async (itemId: string, name: string) => {
      patchItem(itemId, "READY")
      const result = await run(markKitchenItemReady({ itemId }))
      if (!result) {
        await load()
        return
      }
      toast.success(`${name} marked ready`, {
        action: {
          label: "Undo",
          onClick: () => {
            void (async () => {
              const undone = await run(undoKitchenItemReady({ itemId }))
              if (undone) await load()
            })()
          },
        },
      })
      await load()
    },
  }
}
