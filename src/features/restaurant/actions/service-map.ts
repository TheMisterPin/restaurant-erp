import {
  barProgress,
  deriveBarOrderState,
  deriveCourseKitchenState,
  deriveFloorActions,
  deriveTableState,
  immediateItems,
  kitchenItemsOf,
  kitchenProgress,
  minutesSince,
  TABLE_STATE_LABEL,
} from "@/features/restaurant/domain/lifecycle"
import type {
  DomainCourse,
  DomainItem,
  DomainOrder,
} from "@/features/restaurant/domain/types"
import type {
  BarTableDTO,
  CatalogOption,
  KitchenCourseDTO,
  KitchenTableDTO,
  ServiceCourseDTO,
  ServiceItemDTO,
  ServiceOrderDTO,
  ServiceTableDTO,
} from "@/features/restaurant/types/service-types"

type ItemRow = {
  id: string
  courseId: string | null
  catalogItemId: string
  name: string
  kind: DomainItem["kind"]
  station: DomainItem["station"]
  quantity: number
  productionStatus: DomainItem["productionStatus"]
  orderedAt: Date
  releasedAt: Date | null
  preparingAt: Date | null
  readyAt: Date | null
  pickedUpAt: Date | null
  deliveredAt: Date | null
}

type CourseRow = {
  id: string
  name: string
  sequence: number
  firedAt: Date | null
  pickedUpAt: Date | null
  deliveredAt: Date | null
}

type OrderRow = {
  id: string
  covers: number
  submittedAt: Date | null
  billRequestedAt: Date | null
  paidAt: Date | null
  closedAt: Date | null
  courses: CourseRow[]
  items: ItemRow[]
}

type TableRow = {
  id: string
  number: number
  seatCount: number
  location: { name: string }
  orders: OrderRow[]
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export function toDomainItem(row: ItemRow): DomainItem {
  return {
    id: row.id,
    courseId: row.courseId,
    name: row.name,
    kind: row.kind,
    station: row.station,
    quantity: row.quantity,
    productionStatus: row.productionStatus,
    orderedAt: row.orderedAt,
    releasedAt: row.releasedAt,
    preparingAt: row.preparingAt,
    readyAt: row.readyAt,
    pickedUpAt: row.pickedUpAt,
    deliveredAt: row.deliveredAt,
  }
}

export function toDomainCourse(row: CourseRow): DomainCourse {
  return {
    id: row.id,
    name: row.name,
    sequence: row.sequence,
    firedAt: row.firedAt,
    pickedUpAt: row.pickedUpAt,
    deliveredAt: row.deliveredAt,
  }
}

export function toDomainOrder(row: OrderRow): DomainOrder {
  return {
    id: row.id,
    covers: row.covers,
    submittedAt: row.submittedAt,
    billRequestedAt: row.billRequestedAt,
    paidAt: row.paidAt,
    closedAt: row.closedAt,
  }
}

export function toItemDTO(row: ItemRow): ServiceItemDTO {
  return {
    id: row.id,
    courseId: row.courseId,
    catalogItemId: row.catalogItemId,
    name: row.name,
    kind: row.kind,
    station: row.station,
    quantity: row.quantity,
    productionStatus: row.productionStatus,
    orderedAt: row.orderedAt.toISOString(),
    releasedAt: toIso(row.releasedAt),
    preparingAt: toIso(row.preparingAt),
    readyAt: toIso(row.readyAt),
    pickedUpAt: toIso(row.pickedUpAt),
    deliveredAt: toIso(row.deliveredAt),
  }
}

export function toCourseDTO(
  course: CourseRow,
  items: ItemRow[],
): ServiceCourseDTO {
  const domainItems = items.map(toDomainItem)
  const domainCourse = toDomainCourse(course)
  const progress = kitchenProgress(domainCourse, domainItems)
  return {
    id: course.id,
    name: course.name,
    sequence: course.sequence,
    firedAt: toIso(course.firedAt),
    pickedUpAt: toIso(course.pickedUpAt),
    deliveredAt: toIso(course.deliveredAt),
    kitchenState: deriveCourseKitchenState(domainCourse, domainItems),
    kitchenReadyCount: progress.ready,
    kitchenTotal: progress.total,
    items: items
      .filter((item) => item.courseId === course.id)
      .map(toItemDTO),
  }
}

export function activeOrderOf(table: TableRow): OrderRow | null {
  return table.orders[0] ?? null
}

export function toTableDTO(table: TableRow, now: Date): ServiceTableDTO {
  const order = activeOrderOf(table)
  const domainOrder = order ? toDomainOrder(order) : null
  const courses = order?.courses.map(toDomainCourse) ?? []
  const items = order?.items.map(toDomainItem) ?? []
  const tableState = deriveTableState(domainOrder, courses, items)
  const kitchen = kitchenItemsOf(items)
  const bar = barProgress(items)

  return {
    id: table.id,
    number: table.number,
    seatCount: table.seatCount,
    locationName: table.location.name,
    tableState,
    tableStateLabel: TABLE_STATE_LABEL[tableState],
    submittedAt: toIso(order?.submittedAt ?? null),
    waitingMinutes: minutesSince(order?.submittedAt ?? null, now),
    kitchenReadyCount: kitchen.filter(
      (item) =>
        item.productionStatus === "READY" ||
        item.productionStatus === "PICKED_UP" ||
        item.productionStatus === "DELIVERED",
    ).length,
    kitchenTotal: kitchen.length,
    barReadyCount: bar.ready,
    barTotal: bar.total,
    barState: deriveBarOrderState(items),
    actions: deriveFloorActions(domainOrder, courses, items),
    order: order
      ? toOrderDTO(order)
      : null,
  }
}

export function toOrderDTO(order: OrderRow): ServiceOrderDTO {
  return {
    id: order.id,
    covers: order.covers,
    submittedAt: toIso(order.submittedAt),
    billRequestedAt: toIso(order.billRequestedAt),
    paidAt: toIso(order.paidAt),
    closedAt: toIso(order.closedAt),
    courses: order.courses.map((course) => toCourseDTO(course, order.items)),
    immediateItems: immediateItems(order.items.map(toDomainItem)).map((item) => {
      const row = order.items.find((entry) => entry.id === item.id)
      if (!row) {
        throw new Error("Missing order item row")
      }
      return toItemDTO(row)
    }),
  }
}

export function toKitchenTableDTO(table: TableRow): KitchenTableDTO | null {
  const order = activeOrderOf(table)
  if (!order) return null

  const domainItems = order.items.map(toDomainItem)
  const courses: KitchenCourseDTO[] = order.courses.map((course) => {
    const domainCourse = toDomainCourse(course)
    const progress = kitchenProgress(domainCourse, domainItems)
    const kitchenItems = order.items.filter(
      (item) =>
        item.courseId === course.id &&
        (item.station === "GRILL" ||
          item.station === "HOT_KITCHEN" ||
          item.station === "COLD_KITCHEN"),
    )
    return {
      id: course.id,
      name: course.name,
      sequence: course.sequence,
      firedAt: toIso(course.firedAt),
      kitchenState: deriveCourseKitchenState(domainCourse, domainItems),
      kitchenReadyCount: progress.ready,
      kitchenTotal: progress.total,
      upcoming: course.firedAt == null,
      items: kitchenItems.map(toItemDTO),
    }
  })

  const immediateKitchen = order.items.filter(
    (item) =>
      item.courseId == null &&
      (item.station === "GRILL" ||
        item.station === "HOT_KITCHEN" ||
        item.station === "COLD_KITCHEN"),
  )
  if (immediateKitchen.length > 0) {
    const readyCount = immediateKitchen.filter(
      (item) =>
        item.productionStatus === "READY" ||
        item.productionStatus === "PICKED_UP" ||
        item.productionStatus === "DELIVERED",
    ).length
    const awaitingPickup = immediateKitchen.every(
      (item) =>
        item.productionStatus === "READY" ||
        item.productionStatus === "PICKED_UP" ||
        item.productionStatus === "DELIVERED",
    )
    courses.unshift({
      id: `immediate:${order.id}`,
      name: "Immediate",
      sequence: 0,
      firedAt: toIso(order.submittedAt),
      kitchenState: awaitingPickup
        ? immediateKitchen.some((item) => item.productionStatus === "READY")
          ? "READY_FOR_PICKUP"
          : "PICKED_UP"
        : immediateKitchen.some(
              (item) =>
                item.productionStatus === "PREPARING" ||
                item.productionStatus === "READY",
            )
          ? "PREPARING"
          : "FIRED",
      kitchenReadyCount: readyCount,
      kitchenTotal: immediateKitchen.length,
      upcoming: false,
      items: immediateKitchen.map(toItemDTO),
    })
  }

  const hasWork = courses.some((course) => course.items.length > 0)
  if (!hasWork) return null

  return {
    id: table.id,
    number: table.number,
    covers: order.covers,
    courses,
  }
}

export function toBarTableDTO(table: TableRow): BarTableDTO | null {
  const order = activeOrderOf(table)
  if (!order) return null
  const items = order.items.map(toDomainItem)
  const active = items.filter(
    (item) =>
      item.station === "BAR" &&
      (item.productionStatus === "QUEUED" ||
        item.productionStatus === "PREPARING" ||
        item.productionStatus === "READY"),
  )
  if (active.length === 0) return null
  const progress = barProgress(items)
  return {
    id: table.id,
    number: table.number,
    covers: order.covers,
    barState: deriveBarOrderState(items),
    readyCount: progress.ready,
    total: progress.total,
    items: order.items
      .filter((item) => active.some((entry) => entry.id === item.id))
      .map(toItemDTO),
  }
}

export function toCatalogOption(row: {
  id: string
  name: string
  kind: CatalogOption["kind"]
  category: CatalogOption["category"]
  station: CatalogOption["station"]
}): CatalogOption {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    category: row.category,
    station: row.station,
  }
}

export type { TableRow, OrderRow, ItemRow, CourseRow }
