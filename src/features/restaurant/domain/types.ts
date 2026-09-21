export type CatalogItemKind = "FOOD" | "DRINK"

export type CatalogCategory = "STARTER" | "MAIN" | "DESSERT" | "DRINK"

export type ProductionStation = "GRILL" | "HOT_KITCHEN" | "COLD_KITCHEN" | "BAR"

export type ItemProductionStatus =
  | "HELD"
  | "QUEUED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "DELIVERED"

export type CourseKitchenState =
  | "NOT_FIRED"
  | "FIRED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"

export type BarOrderState = "NONE" | "PREPARING" | "READY_FOR_PICKUP"

export type TableLifecycle =
  | "AVAILABLE"
  | "SEATED"
  | "ORDERING"
  | "ORDER_IN_PROGRESS"
  | "ITEMS_READY"
  | "AWAITING_PICKUP"
  | "SERVICE_IN_PROGRESS"
  | "BILL_REQUESTED"
  | "AWAITING_PAYMENT"

export const KITCHEN_STATIONS: readonly ProductionStation[] = [
  "GRILL",
  "HOT_KITCHEN",
  "COLD_KITCHEN",
]

export const ITEM_STATUS_RANK: Record<ItemProductionStatus, number> = {
  HELD: 0,
  QUEUED: 1,
  PREPARING: 2,
  READY: 3,
  PICKED_UP: 4,
  DELIVERED: 5,
}

export type DomainItem = {
  id: string
  courseId: string | null
  name: string
  kind: CatalogItemKind
  station: ProductionStation
  quantity: number
  productionStatus: ItemProductionStatus
  orderedAt: Date
  releasedAt: Date | null
  preparingAt: Date | null
  readyAt: Date | null
  pickedUpAt: Date | null
  deliveredAt: Date | null
}

export type DomainCourse = {
  id: string
  name: string
  sequence: number
  firedAt: Date | null
  pickedUpAt: Date | null
  deliveredAt: Date | null
}

export type DomainOrder = {
  id: string
  covers: number
  submittedAt: Date | null
  billRequestedAt: Date | null
  paidAt: Date | null
  closedAt: Date | null
}

export type DomainTable = {
  id: string
  number: number
  seatCount: number
}

export type CatalogOption = {
  id: string
  name: string
  kind: CatalogItemKind
  category: CatalogCategory
  station: ProductionStation
}

export type FloorActionFlags = {
  fireNextCourse: boolean
  addFood: boolean
  addDrinks: boolean
  pickupKitchen: boolean
  pickupDrinks: boolean
  deliverCourse: boolean
  printBill: boolean
  takePayment: boolean
  clearTable: boolean
}

export type FohAlert = {
  key: string
  message: string
}
