"use client"

import { useCallback, useEffect, useRef } from "react"

import { useModalContext } from "@/components/shared/modals/modal-context"
import type {
  ConfirmModalConfig,
  NotificationModalConfig,
} from "@/components/shared/modals/types"

type ConfirmOptions = Omit<
  ConfirmModalConfig,
  "type" | "onConfirm" | "onCancel"
>

type NotifyOptions = Omit<NotificationModalConfig, "type">

export function useModal() {
  const { stack, openModal, closeModal, setDirty, closeAll } = useModalContext()

  const pendingConfirmsRef = useRef(
    new Map<string, (value: boolean) => void>(),
  )

  useEffect(() => {
    const pending = pendingConfirmsRef.current
    for (const [id, resolve] of pending) {
      const stillOpen = stack.some((entry) => entry.id === id)
      if (!stillOpen) {
        pending.delete(id)
        resolve(false)
      }
    }
  }, [stack])

  const confirm = useCallback(
    (config: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        let settled = false
        let id = ""

        const settle = (value: boolean) => {
          if (settled) return
          settled = true
          pendingConfirmsRef.current.delete(id)
          resolve(value)
          closeModal(id)
        }

        id = openModal({
          type: "confirm",
          ...config,
          onConfirm: () => settle(true),
          onCancel: () => settle(false),
        })

        pendingConfirmsRef.current.set(id, (value) => {
          if (settled) return
          settled = true
          pendingConfirmsRef.current.delete(id)
          resolve(value)
        })
      })
    },
    [openModal, closeModal],
  )

  const notify = useCallback(
    (config: NotifyOptions): string => {
      return openModal({ type: "notification", ...config })
    },
    [openModal],
  )

  return {
    openModal,
    closeModal,
    setDirty,
    closeAll,
    confirm,
    notify,
  }
}
