import type { ReactNode } from "react"

export type NotificationModalConfig = {
  type: "notification"
  variant: "error" | "warning" | "success"
  title: string
  message: string
  onAcknowledge?: () => void
  acknowledgeLabel?: string
}

export type ConfirmModalConfig = {
  type: "confirm"
  title: string
  message: string
  onConfirm: () => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

export type FormModalConfig = {
  type: "form"
  title?: string
  component: ReactNode
  size?: "sm" | "md" | "lg"
}

export type ModalConfig =
  | NotificationModalConfig
  | ConfirmModalConfig
  | FormModalConfig

export type StackEntry =
  | (NotificationModalConfig & { id: string })
  | (ConfirmModalConfig & { id: string })
  | (FormModalConfig & { id: string; isDirty: boolean })

export type ModalContextValue = {
  stack: StackEntry[]
  openModal: (config: ModalConfig) => string
  closeModal: (id?: string) => void
  setDirty: (id: string, isDirty: boolean) => void
  closeAll: () => void
}
