import type {
  BarOrderState,
  CatalogCategory,
  CatalogItemKind,
  CatalogOption,
  CourseKitchenState,
  FloorActionFlags,
  ItemProductionStatus,
  ProductionStation,
  TableLifecycle,
} from "@/features/restaurant/domain/types"

export type {
  BarOrderState,
  CatalogCategory,
  CatalogItemKind,
  CatalogOption,
  CourseKitchenState,
  FloorActionFlags,
  ItemProductionStatus,
  ProductionStation,
  TableLifecycle,
}

export type ServiceItemDTO = {
  id: string
  courseId: string | null
  catalogItemId: string
  name: string
  kind: CatalogItemKind
  station: ProductionStation
  quantity: number
  productionStatus: ItemProductionStatus
  orderedAt: string
  releasedAt: string | null
  preparingAt: string | null
  readyAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
}

export type ServiceCourseDTO = {
  id: string
  name: string
  sequence: number
  firedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  kitchenState: CourseKitchenState
  kitchenReadyCount: number
  kitchenTotal: number
  items: ServiceItemDTO[]
}

export type ServiceOrderDTO = {
  id: string
  covers: number
  submittedAt: string | null
  billRequestedAt: string | null
  paidAt: string | null
  closedAt: string | null
  courses: ServiceCourseDTO[]
  immediateItems: ServiceItemDTO[]
}

export type ServiceTableDTO = {
  id: string
  number: number
  seatCount: number
  locationName: string
  tableState: TableLifecycle
  tableStateLabel: string
  submittedAt: string | null
  waitingMinutes: number | null
  kitchenReadyCount: number
  kitchenTotal: number
  barReadyCount: number
  barTotal: number
  barState: BarOrderState
  actions: FloorActionFlags
  order: ServiceOrderDTO | null
}

export type FloorSnapshot = {
  now: string
  tables: ServiceTableDTO[]
  catalog: CatalogOption[]
}

export type KitchenCourseDTO = {
  id: string
  name: string
  sequence: number
  firedAt: string | null
  kitchenState: CourseKitchenState
  kitchenReadyCount: number
  kitchenTotal: number
  upcoming: boolean
  items: ServiceItemDTO[]
}

export type KitchenTableDTO = {
  id: string
  number: number
  covers: number
  courses: KitchenCourseDTO[]
}

export type KitchenSnapshot = {
  now: string
  tables: KitchenTableDTO[]
}

export type BarTableDTO = {
  id: string
  number: number
  covers: number
  barState: BarOrderState
  readyCount: number
  total: number
  items: ServiceItemDTO[]
}

export type BarSnapshot = {
  now: string
  tables: BarTableDTO[]
}
