import {
  ITEM_STATUS_RANK,
  KITCHEN_STATIONS,
  type BarOrderState,
  type CourseKitchenState,
  type DomainCourse,
  type DomainItem,
  type DomainOrder,
  type FloorActionFlags,
  type FohAlert,
  type ItemProductionStatus,
  type ProductionStation,
  type TableLifecycle,
} from "@/features/restaurant/domain/types"

export function isKitchenStation(station: ProductionStation): boolean {
  return KITCHEN_STATIONS.includes(station)
}

export function isBarStation(station: ProductionStation): boolean {
  return station === "BAR"
}

export function kitchenItemsOf(items: DomainItem[]): DomainItem[] {
  return items.filter((item) => isKitchenStation(item.station))
}

export function barItemsOf(items: DomainItem[]): DomainItem[] {
  return items.filter((item) => isBarStation(item.station))
}

export function itemsForCourse(
  items: DomainItem[],
  courseId: string,
): DomainItem[] {
  return items.filter((item) => item.courseId === courseId)
}

export function immediateItems(items: DomainItem[]): DomainItem[] {
  return items.filter((item) => item.courseId == null)
}

export function immediateKitchenItems(items: DomainItem[]): DomainItem[] {
  return kitchenItemsOf(immediateItems(items))
}

export function hasImmediatePickedUpKitchen(items: DomainItem[]): boolean {
  return immediateKitchenItems(items).some(
    (item) => item.productionStatus === "PICKED_UP",
  )
}

export function immediateKitchenAwaitingPickup(items: DomainItem[]): boolean {
  const outstanding = immediateKitchenItems(items).filter(
    (item) =>
      item.productionStatus !== "PICKED_UP" &&
      item.productionStatus !== "DELIVERED",
  )
  if (outstanding.length === 0) return false
  return outstanding.every((item) => item.productionStatus === "READY")
}

const ACTIVE_BAR_STATUSES: ReadonlySet<ItemProductionStatus> = new Set([
  "QUEUED",
  "PREPARING",
  "READY",
])

export function activeBarItems(items: DomainItem[]): DomainItem[] {
  return barItemsOf(items).filter((item) =>
    ACTIVE_BAR_STATUSES.has(item.productionStatus),
  )
}

export function heldBarItems(items: DomainItem[]): DomainItem[] {
  return barItemsOf(items).filter((item) => item.productionStatus === "HELD")
}

export function isReadyOrLater(status: ItemProductionStatus): boolean {
  return ITEM_STATUS_RANK[status] >= ITEM_STATUS_RANK.READY
}

export function deriveCourseKitchenState(
  course: DomainCourse,
  items: DomainItem[],
): CourseKitchenState {
  if (course.deliveredAt) return "DELIVERED"
  if (course.pickedUpAt) return "PICKED_UP"
  if (!course.firedAt) return "NOT_FIRED"

  const kitchenItems = kitchenItemsOf(itemsForCourse(items, course.id))
  if (kitchenItems.length === 0) return "READY_FOR_PICKUP"
  if (kitchenItems.every((item) => isReadyOrLater(item.productionStatus))) {
    return "READY_FOR_PICKUP"
  }
  if (
    kitchenItems.some(
      (item) =>
        item.productionStatus === "PREPARING" ||
        item.productionStatus === "READY",
    )
  ) {
    return "PREPARING"
  }
  return "FIRED"
}

export function kitchenProgress(
  course: DomainCourse,
  items: DomainItem[],
): { ready: number; total: number } {
  const kitchenItems = kitchenItemsOf(itemsForCourse(items, course.id))
  return {
    ready: kitchenItems.filter((item) => isReadyOrLater(item.productionStatus))
      .length,
    total: kitchenItems.length,
  }
}

export function deriveBarOrderState(items: DomainItem[]): BarOrderState {
  const active = activeBarItems(items)
  if (active.length === 0) return "NONE"
  if (active.every((item) => item.productionStatus === "READY")) {
    return "READY_FOR_PICKUP"
  }
  return "PREPARING"
}

export function barProgress(items: DomainItem[]): {
  ready: number
  total: number
} {
  const active = activeBarItems(items)
  return {
    ready: active.filter((item) => item.productionStatus === "READY").length,
    total: active.length,
  }
}

export function nextUnfiredCourse(
  courses: DomainCourse[],
): DomainCourse | null {
  return (
    [...courses]
      .sort((a, b) => a.sequence - b.sequence)
      .find((course) => !course.firedAt) ?? null
  )
}

export function pickupKitchenCourse(
  courses: DomainCourse[],
  items: DomainItem[],
): DomainCourse | null {
  return (
    [...courses]
      .sort((a, b) => a.sequence - b.sequence)
      .find(
        (course) => deriveCourseKitchenState(course, items) === "READY_FOR_PICKUP",
      ) ?? null
  )
}

export function deliverableCourse(
  courses: DomainCourse[],
  items: DomainItem[],
): DomainCourse | null {
  return (
    [...courses]
      .sort((a, b) => a.sequence - b.sequence)
      .find(
        (course) => deriveCourseKitchenState(course, items) === "PICKED_UP",
      ) ?? null
  )
}

export function deriveTableState(
  order: DomainOrder | null,
  courses: DomainCourse[],
  items: DomainItem[],
): TableLifecycle {
  if (!order || order.closedAt) return "AVAILABLE"
  if (order.paidAt) return "AWAITING_PAYMENT"
  if (order.billRequestedAt) return "BILL_REQUESTED"
  if (!order.submittedAt) return "SEATED"

  const kitchenAwaiting =
    courses.some(
      (course) => deriveCourseKitchenState(course, items) === "READY_FOR_PICKUP",
    ) || immediateKitchenAwaitingPickup(items)
  if (kitchenAwaiting || deriveBarOrderState(items) === "READY_FOR_PICKUP") {
    return "AWAITING_PICKUP"
  }

  const firedKitchenItems = kitchenItemsOf(items).filter((item) => {
    if (!item.courseId) {
      return (
        item.productionStatus === "QUEUED" ||
        item.productionStatus === "PREPARING" ||
        item.productionStatus === "READY"
      )
    }
    const course = courses.find((entry) => entry.id === item.courseId)
    return Boolean(course?.firedAt) && !course?.pickedUpAt
  })

  const someReady = firedKitchenItems.some(
    (item) => item.productionStatus === "READY",
  )
  const someOutstanding = firedKitchenItems.some(
    (item) =>
      item.productionStatus === "QUEUED" ||
      item.productionStatus === "PREPARING",
  )
  if (someReady && someOutstanding) return "ITEMS_READY"
  if (someOutstanding) return "ORDER_IN_PROGRESS"

  const inService = courses.some(
    (course) =>
      deriveCourseKitchenState(course, items) === "PICKED_UP" ||
      (course.deliveredAt != null &&
        nextUnfiredCourse(courses) != null),
  )
  if (inService) return "SERVICE_IN_PROGRESS"

  if (activeBarItems(items).length > 0) return "ORDER_IN_PROGRESS"

  return "SERVICE_IN_PROGRESS"
}

export function deriveFloorActions(
  order: DomainOrder | null,
  courses: DomainCourse[],
  items: DomainItem[],
): FloorActionFlags {
  const tableState = deriveTableState(order, courses, items)
  const hasOpenOrder =
    order != null && order.closedAt == null && order.paidAt == null
  const submitted = Boolean(order?.submittedAt) && hasOpenOrder

  return {
    fireNextCourse: submitted && nextUnfiredCourse(courses) != null,
    addFood: submitted,
    addDrinks: submitted,
    pickupKitchen:
      submitted &&
      (pickupKitchenCourse(courses, items) != null ||
        immediateKitchenAwaitingPickup(items)),
    pickupDrinks:
      submitted && deriveBarOrderState(items) === "READY_FOR_PICKUP",
    deliverCourse:
      submitted &&
      (deliverableCourse(courses, items) != null ||
        hasImmediatePickedUpKitchen(items)),
    printBill:
      submitted &&
      order?.billRequestedAt == null &&
      tableState !== "AWAITING_PAYMENT",
    takePayment: order?.billRequestedAt != null && order.paidAt == null,
    clearTable: order?.paidAt != null && order.closedAt == null,
  }
}

export type ItemRelease = {
  productionStatus: ItemProductionStatus
  releasedAt: Date | null
}

/** Where a new line should start, given optional course timestamps. */
export function initialReleaseForItem(input: {
  station: ProductionStation
  course: DomainCourse | null
  now: Date
}): ItemRelease {
  if (isBarStation(input.station)) {
    if (!input.course || input.course.pickedUpAt) {
      return { productionStatus: "QUEUED", releasedAt: input.now }
    }
    return { productionStatus: "HELD", releasedAt: null }
  }

  if (!input.course || input.course.firedAt) {
    return { productionStatus: "QUEUED", releasedAt: input.now }
  }
  return { productionStatus: "HELD", releasedAt: null }
}

export function releaseKitchenItemsOnFire(
  items: DomainItem[],
  courseId: string,
  now: Date,
): DomainItem[] {
  return items.map((item) => {
    if (item.courseId !== courseId) return item
    if (!isKitchenStation(item.station)) return item
    if (item.productionStatus !== "HELD" && item.releasedAt) return item
    return {
      ...item,
      productionStatus: "QUEUED",
      releasedAt: item.releasedAt ?? now,
    }
  })
}

export function releaseBarItemsOnKitchenPickup(
  items: DomainItem[],
  courseId: string,
  now: Date,
): DomainItem[] {
  return items.map((item) => {
    if (item.courseId !== courseId) return item
    if (!isBarStation(item.station)) return item
    if (item.productionStatus !== "HELD") return item
    return {
      ...item,
      productionStatus: "QUEUED",
      releasedAt: now,
    }
  })
}

export type CourseAlertSnapshot = {
  tableNumber: number
  courseId: string
  courseName: string
  kitchenState: CourseKitchenState
}

export type BarAlertSnapshot = {
  tableNumber: number
  tableId: string
  barState: BarOrderState
}

export function fohAlertsFromDiff(input: {
  prevCourses: CourseAlertSnapshot[]
  nextCourses: CourseAlertSnapshot[]
  prevBars: BarAlertSnapshot[]
  nextBars: BarAlertSnapshot[]
}): FohAlert[] {
  const alerts: FohAlert[] = []
  const prevCourseById = new Map(
    input.prevCourses.map((course) => [course.courseId, course]),
  )

  for (const course of input.nextCourses) {
    const prev = prevCourseById.get(course.courseId)
    if (
      course.kitchenState === "READY_FOR_PICKUP" &&
      prev?.kitchenState !== "READY_FOR_PICKUP"
    ) {
      alerts.push({
        key: `kitchen-ready:${course.courseId}`,
        message: `Table ${course.tableNumber} — ${course.courseName} ready for pickup`,
      })
    }
  }

  const prevBarByTable = new Map(
    input.prevBars.map((bar) => [bar.tableId, bar]),
  )
  for (const bar of input.nextBars) {
    const prev = prevBarByTable.get(bar.tableId)
    if (
      bar.barState === "READY_FOR_PICKUP" &&
      prev?.barState !== "READY_FOR_PICKUP"
    ) {
      alerts.push({
        key: `bar-ready:${bar.tableId}`,
        message: `Table ${bar.tableNumber} — Drinks ready for pickup`,
      })
    }
  }

  return alerts
}

export function minutesSince(from: Date | null, now: Date): number | null {
  if (!from) return null
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / 60_000))
}

export function waitingLabel(from: Date | null, now: Date): string | null {
  const minutes = minutesSince(from, now)
  if (minutes == null) return null
  if (minutes < 1) return "just now"
  return `${minutes} min`
}

export const TABLE_STATE_LABEL: Record<TableLifecycle, string> = {
  AVAILABLE: "Available",
  SEATED: "Seated",
  ORDERING: "Ordering",
  ORDER_IN_PROGRESS: "Order in progress",
  ITEMS_READY: "Items ready",
  AWAITING_PICKUP: "Awaiting pickup",
  SERVICE_IN_PROGRESS: "Service in progress",
  BILL_REQUESTED: "Bill requested",
  AWAITING_PAYMENT: "Awaiting payment",
}

export const COURSE_STATE_LABEL: Record<CourseKitchenState, string> = {
  NOT_FIRED: "Not fired",
  FIRED: "Fired",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
}

export const ITEM_STATUS_LABEL: Record<ItemProductionStatus, string> = {
  HELD: "Held",
  QUEUED: "Queued",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
}

export const STATION_LABEL: Record<ProductionStation, string> = {
  GRILL: "Grill",
  HOT_KITCHEN: "Hot kitchen",
  COLD_KITCHEN: "Cold kitchen",
  BAR: "Bar",
}
