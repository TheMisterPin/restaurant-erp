import { Badge } from "@/components/ui/badge"
import type {
  CourseKitchenState,
  ItemProductionStatus,
  TableLifecycle,
} from "@/features/restaurant/domain/types"

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "error"
  | "neutral"

export function tableStateBadgeVariant(
  state: TableLifecycle,
): BadgeVariant {
  switch (state) {
    case "AVAILABLE":
      return "outline"
    case "AWAITING_PICKUP":
    case "ITEMS_READY":
      return "warning"
    case "BILL_REQUESTED":
    case "AWAITING_PAYMENT":
      return "info"
    case "SERVICE_IN_PROGRESS":
      return "success"
    case "ORDER_IN_PROGRESS":
    case "ORDERING":
    case "SEATED":
      return "secondary"
    default:
      return "neutral"
  }
}

export function courseStateBadgeVariant(
  state: CourseKitchenState,
): BadgeVariant {
  switch (state) {
    case "READY_FOR_PICKUP":
      return "warning"
    case "PREPARING":
    case "FIRED":
      return "info"
    case "PICKED_UP":
    case "DELIVERED":
      return "success"
    default:
      return "neutral"
  }
}

export function itemStateBadgeVariant(
  status: ItemProductionStatus,
): BadgeVariant {
  switch (status) {
    case "READY":
      return "warning"
    case "PREPARING":
    case "QUEUED":
      return "info"
    case "PICKED_UP":
    case "DELIVERED":
      return "success"
    case "HELD":
      return "neutral"
    default:
      return "outline"
  }
}

export function StatusBadge({
  label,
  variant,
}: {
  label: string
  variant: BadgeVariant
}) {
  return <Badge variant={variant}>{label}</Badge>
}
