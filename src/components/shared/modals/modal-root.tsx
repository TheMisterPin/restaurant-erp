"use client"

import { useRef } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  type LucideIcon,
} from "lucide-react"

import { useModalContext } from "@/components/shared/modals/modal-context"
import type {
  ConfirmModalConfig,
  FormModalConfig,
  NotificationModalConfig,
  StackEntry,
} from "@/components/shared/modals/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const FORM_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
}

const NOTIFICATION_VARIANT: Record<
  "error" | "warning" | "success",
  { Icon: LucideIcon; iconClassName: string }
> = {
  error: {
    Icon: CircleAlert,
    iconClassName: "text-destructive",
  },
  warning: {
    Icon: AlertTriangle,
    iconClassName: "text-amber-500",
  },
  success: {
    Icon: CheckCircle2,
    iconClassName: "text-emerald-500",
  },
}

function stackZIndex(index: number): number {
  // Base shadcn dialogs use z-50; bump later stack entries above earlier ones.
  return 50 + index
}

type NotificationEntry = NotificationModalConfig & { id: string }
type ConfirmEntry = ConfirmModalConfig & { id: string }
type FormEntry = FormModalConfig & { id: string; isDirty: boolean }

function NotificationModal({
  entry,
  index,
}: {
  entry: NotificationEntry
  index: number
}) {
  const { closeModal } = useModalContext()
  const handled = useRef(false)
  const { Icon, iconClassName } = NOTIFICATION_VARIANT[entry.variant]
  const zIndex = stackZIndex(index)

  const acknowledge = () => {
    if (handled.current) return
    handled.current = true
    entry.onAcknowledge?.()
    closeModal(entry.id)
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) acknowledge()
      }}
    >
      <DialogContent className="modal-content-spring" style={{ zIndex }}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <Icon className={cn("mt-0.5 size-5 shrink-0", iconClassName)} />
            <div className="space-y-1.5">
              <DialogTitle>{entry.title}</DialogTitle>
              <DialogDescription>{entry.message}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={acknowledge}>
            {entry.acknowledgeLabel ?? "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmModal({
  entry,
  index,
}: {
  entry: ConfirmEntry
  index: number
}) {
  const { closeModal } = useModalContext()
  const handled = useRef(false)
  const zIndex = stackZIndex(index)
  const isDestructive = entry.variant === "destructive"

  const settle = (confirmed: boolean) => {
    if (handled.current) return
    handled.current = true
    if (confirmed) {
      entry.onConfirm()
    } else {
      entry.onCancel?.()
    }
    closeModal(entry.id)
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) settle(false)
      }}
    >
      <AlertDialogContent className="modal-content-spring" style={{ zIndex }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{entry.title}</AlertDialogTitle>
          <AlertDialogDescription>{entry.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>
            {entry.cancelLabel ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={
              isDestructive
                ? buttonVariants({ variant: "destructive" })
                : undefined
            }
            onClick={() => settle(true)}
          >
            {entry.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function FormModal({
  entry,
  index,
}: {
  entry: FormEntry
  index: number
}) {
  const { openModal, closeModal } = useModalContext()
  const zIndex = stackZIndex(index)
  const size = entry.size ?? "md"

  const requestClose = () => {
    if (!entry.isDirty) {
      closeModal(entry.id)
      return
    }

    const formId = entry.id
    const warningId = openModal({
      type: "confirm",
      title: "Discard unsaved changes?",
      message:
        "You have unsaved edits. If you leave now, those changes will be lost.",
      variant: "destructive",
      confirmLabel: "Discard",
      cancelLabel: "Keep editing",
      onConfirm: () => {
        closeModal(warningId)
        closeModal(formId)
      },
      onCancel: () => {
        closeModal(warningId)
      },
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
    >
      <DialogContent
        className={cn(
          "modal-content-spring flex flex-col gap-4 overflow-hidden",
          FORM_SIZE_CLASS[size],
        )}
        style={{ zIndex }}
      >
        {entry.title ? (
          <DialogHeader className="shrink-0 pr-6">
            <DialogTitle>{entry.title}</DialogTitle>
          </DialogHeader>
        ) : null}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          {entry.component}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function renderEntry(entry: StackEntry, index: number) {
  switch (entry.type) {
    case "notification":
      return <NotificationModal key={entry.id} entry={entry} index={index} />
    case "confirm":
      return <ConfirmModal key={entry.id} entry={entry} index={index} />
    case "form":
      return <FormModal key={entry.id} entry={entry} index={index} />
    default: {
      const _exhaustive: never = entry
      return _exhaustive
    }
  }
}

export function ModalRoot() {
  const { stack } = useModalContext()

  return <>{stack.map((entry, index) => renderEntry(entry, index))}</>
}
