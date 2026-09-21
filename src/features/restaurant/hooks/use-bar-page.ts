"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Actions, can } from "@/features/auth/permissions"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useError } from "@/features/errors"
import {
  getBarSnapshot,
  markBarItemReady,
  startBarItem,
  undoBarItemReady,
} from "@/features/restaurant/actions/service-actions"
import type { BarPageProps } from "@/features/restaurant/components/pages/bar-page"
import type { BarSnapshot } from "@/features/restaurant/types/service-types"

export function useBarPage(): BarPageProps {
  const { run } = useError()
  const { me } = useAuth()
  const [snapshot, setSnapshot] = useState<BarSnapshot | null>(null)
  const [loaded, setLoaded] = useState(false)
  const canWrite = me ? can(me.role, Actions.bar.write) : false

  const load = useCallback(async () => {
    if (!me || !can(me.role, Actions.bar.read)) return
    const data = await run(getBarSnapshot())
    if (!data) return
    setSnapshot(data)
    setLoaded(true)
  }, [me, run])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!me || !can(me.role, Actions.bar.read)) return
      const data = await run(getBarSnapshot())
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

  const patchItem = (itemId: string, status: "PREPARING" | "READY") => {
    setSnapshot((current) => {
      if (!current) return current
      return {
        ...current,
        tables: current.tables.map((table) => ({
          ...table,
          items: table.items.map((item) =>
            item.id === itemId ? { ...item, productionStatus: status } : item,
          ),
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
      const result = await run(startBarItem({ itemId }))
      if (!result) {
        await load()
        return
      }
      await load()
    },
    onReady: async (itemId: string, name: string) => {
      patchItem(itemId, "READY")
      const result = await run(markBarItemReady({ itemId }))
      if (!result) {
        await load()
        return
      }
      toast.success(`${name} marked ready`, {
        action: {
          label: "Undo",
          onClick: () => {
            void (async () => {
              const undone = await run(undoBarItemReady({ itemId }))
              if (undone) await load()
            })()
          },
        },
      })
      await load()
    },
  }
}
