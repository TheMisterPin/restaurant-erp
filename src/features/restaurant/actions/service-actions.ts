"use server"

import type { Activity, Prisma, ServiceEventType } from "@/generated/prisma/client"

import { Actions } from "@/features/auth/permissions"
import { authorize } from "@/features/auth/session"
import type { ActionResult } from "@/features/errors/dto"
import { AppError, withErrorBoundary } from "@/features/errors/server"
import { logActivity } from "@/features/logging/server"
import {
  deriveBarOrderState,
  immediateKitchenAwaitingPickup,
  initialReleaseForItem,
  isBarStation,
  isKitchenStation,
  nextUnfiredCourse,
  pickupKitchenCourse,
} from "@/features/restaurant/domain/lifecycle"
import type { DomainCourse } from "@/features/restaurant/domain/types"
import {
  activeOrderOf,
  toBarTableDTO,
  toCatalogOption,
  toDomainCourse,
  toDomainItem,
  toKitchenTableDTO,
  toTableDTO,
  type TableRow,
} from "@/features/restaurant/actions/service-map"
import type {
  BarSnapshot,
  FloorSnapshot,
  KitchenSnapshot,
} from "@/features/restaurant/types/service-types"
import { prisma } from "@/lib/db"
import {
  addOrderItemsSchema,
  itemIdSchema,
  tableIdSchema,
} from "@/lib/schemas/service"

const tableInclude = {
  location: { select: { name: true } },
  orders: {
    where: { closedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: {
      courses: { orderBy: { sequence: "asc" as const } },
      items: { orderBy: { orderedAt: "asc" as const } },
    },
  },
} satisfies Prisma.DiningTableInclude

async function loadTables(): Promise<TableRow[]> {
  return prisma.diningTable.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { number: "asc" },
    include: tableInclude,
  })
}

async function loadTable(tableId: string): Promise<TableRow> {
  const table = await prisma.diningTable.findFirst({
    where: { id: tableId, deletedAt: null },
    include: tableInclude,
  })
  if (!table) {
    throw new AppError({
      kind: "not_found",
      code: "TABLE_NOT_FOUND",
      message: "That table could not be found.",
    })
  }
  return table
}

function requireActiveOrder(table: TableRow) {
  const order = activeOrderOf(table)
  if (!order) {
    throw new AppError({
      kind: "conflict",
      code: "NO_ACTIVE_ORDER",
      message: "This table has no active order.",
    })
  }
  if (!order.submittedAt) {
    throw new AppError({
      kind: "conflict",
      code: "ORDER_NOT_SUBMITTED",
      message: "The order has not been submitted yet.",
    })
  }
  if (order.paidAt || order.closedAt) {
    throw new AppError({
      kind: "conflict",
      code: "ORDER_CLOSED",
      message: "This order is no longer in service.",
    })
  }
  return order
}

async function recordEvent(
  db: Prisma.TransactionClient,
  input: {
    type: ServiceEventType
    orderId: string
    tableId: string
    actorUserId: string
    courseId?: string | null
    itemId?: string | null
    payload?: Prisma.InputJsonValue
  },
) {
  await db.serviceEvent.create({
    data: {
      type: input.type,
      orderId: input.orderId,
      tableId: input.tableId,
      actorUserId: input.actorUserId,
      courseId: input.courseId ?? null,
      itemId: input.itemId ?? null,
      payload: input.payload,
    },
  })
}

async function audit(
  db: Prisma.TransactionClient,
  userId: string,
  activity: Activity,
  activityData?: Prisma.InputJsonValue,
) {
  await logActivity({ userId, activity, activityData }, db)
}

export async function getFloorSnapshot(): Promise<ActionResult<FloorSnapshot>> {
  return withErrorBoundary(async () => {
    await authorize(Actions.floor.read)
    const now = new Date()
    const [tables, catalog] = await Promise.all([
      loadTables(),
      prisma.catalogItem.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: [{ kind: "asc" }, { category: "asc" }, { name: "asc" }],
      }),
    ])
    return {
      now: now.toISOString(),
      tables: tables.map((table) => toTableDTO(table, now)),
      catalog: catalog.map(toCatalogOption),
    }
  })
}

export async function getKitchenSnapshot(): Promise<ActionResult<KitchenSnapshot>> {
  return withErrorBoundary(async () => {
    await authorize(Actions.kitchen.read)
    const now = new Date()
    const tables = await loadTables()
    return {
      now: now.toISOString(),
      tables: tables
        .map(toKitchenTableDTO)
        .filter((table): table is NonNullable<typeof table> => table != null),
    }
  })
}

export async function getBarSnapshot(): Promise<ActionResult<BarSnapshot>> {
  return withErrorBoundary(async () => {
    await authorize(Actions.bar.read)
    const now = new Date()
    const tables = await loadTables()
    return {
      now: now.toISOString(),
      tables: tables
        .map(toBarTableDTO)
        .filter((table): table is NonNullable<typeof table> => table != null),
    }
  })
}

export async function fireNextCourse(
  input: unknown,
): Promise<ActionResult<{ tableId: string; courseId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const { tableId } = tableIdSchema.parse(input)
    const table = await loadTable(tableId)
    const order = requireActiveOrder(table)
    const courses = order.courses.map(toDomainCourse)
    const next = nextUnfiredCourse(courses)
    if (!next) {
      throw new AppError({
        kind: "conflict",
        code: "NO_UPCOMING_COURSE",
        message: "There is no upcoming course to fire.",
      })
    }

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: next.id },
        data: { firedAt: now },
      })
      const heldKitchen = order.items.filter(
        (item) =>
          item.courseId === next.id &&
          isKitchenStation(item.station) &&
          item.productionStatus === "HELD",
      )
      for (const item of heldKitchen) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            productionStatus: "QUEUED",
            releasedAt: now,
          },
        })
        await recordEvent(tx, {
          type: "ITEM_RELEASED",
          orderId: order.id,
          tableId,
          actorUserId: session.userId,
          courseId: next.id,
          itemId: item.id,
        })
      }
      await recordEvent(tx, {
        type: "COURSE_FIRED",
        orderId: order.id,
        tableId,
        actorUserId: session.userId,
        courseId: next.id,
      })
      await audit(tx, session.userId, "SERVICE_COURSE_FIRED", {
        tableId,
        tableNumber: table.number,
        courseId: next.id,
        courseName: next.name,
      })
    })

    return { tableId, courseId: next.id }
  })
}

export async function addOrderItems(
  input: unknown,
): Promise<ActionResult<{ tableId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const parsed = addOrderItemsSchema.parse(input)
    const table = await loadTable(parsed.tableId)
    const order = requireActiveOrder(table)

    let course: DomainCourse | null = null
    if (parsed.courseId) {
      const row = order.courses.find((entry) => entry.id === parsed.courseId)
      if (!row) {
        throw new AppError({
          kind: "not_found",
          code: "COURSE_NOT_FOUND",
          message: "That course could not be found on this order.",
        })
      }
      if (row.deliveredAt) {
        throw new AppError({
          kind: "conflict",
          code: "COURSE_ALREADY_DELIVERED",
          message: "That course has already been delivered.",
        })
      }
      course = toDomainCourse(row)
    }

    const catalog = await prisma.catalogItem.findMany({
      where: {
        id: { in: parsed.catalogItemIds },
        deletedAt: null,
        isActive: true,
      },
    })
    if (catalog.length !== parsed.catalogItemIds.length) {
      throw new AppError({
        kind: "not_found",
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "One or more menu items could not be found.",
      })
    }

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      for (const catalogItem of catalog) {
        const release = initialReleaseForItem({
          station: catalogItem.station,
          course,
          now,
        })
        const created = await tx.orderItem.create({
          data: {
            orderId: order.id,
            courseId: course?.id ?? null,
            catalogItemId: catalogItem.id,
            name: catalogItem.name,
            kind: catalogItem.kind,
            station: catalogItem.station,
            quantity: 1,
            productionStatus: release.productionStatus,
            orderedAt: now,
            releasedAt: release.releasedAt,
          },
        })
        await recordEvent(tx, {
          type: "ITEM_ADDED",
          orderId: order.id,
          tableId: parsed.tableId,
          actorUserId: session.userId,
          courseId: course?.id ?? null,
          itemId: created.id,
          payload: { name: catalogItem.name, station: catalogItem.station },
        })
        if (release.productionStatus === "QUEUED") {
          await recordEvent(tx, {
            type: "ITEM_RELEASED",
            orderId: order.id,
            tableId: parsed.tableId,
            actorUserId: session.userId,
            courseId: course?.id ?? null,
            itemId: created.id,
          })
        }
      }
      await audit(tx, session.userId, "SERVICE_ITEMS_ADDED", {
        tableId: parsed.tableId,
        tableNumber: table.number,
        count: catalog.length,
        courseId: course?.id ?? null,
      })
    })

    return { tableId: parsed.tableId }
  })
}

export async function pickupKitchen(
  input: unknown,
): Promise<ActionResult<{ tableId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const { tableId } = tableIdSchema.parse(input)
    const table = await loadTable(tableId)
    const order = requireActiveOrder(table)
    const items = order.items.map(toDomainItem)
    const courses = order.courses.map(toDomainCourse)
    const course = pickupKitchenCourse(courses, items)
    const now = new Date()

    if (course) {
      await prisma.$transaction(async (tx) => {
        await tx.course.update({
          where: { id: course.id },
          data: { pickedUpAt: now },
        })
        const kitchenReady = order.items.filter(
          (item) =>
            item.courseId === course.id &&
            isKitchenStation(item.station) &&
            item.productionStatus === "READY",
        )
        for (const item of kitchenReady) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              productionStatus: "PICKED_UP",
              pickedUpAt: now,
            },
          })
        }
        const heldDrinks = order.items.filter(
          (item) =>
            item.courseId === course.id &&
            isBarStation(item.station) &&
            item.productionStatus === "HELD",
        )
        for (const item of heldDrinks) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              productionStatus: "QUEUED",
              releasedAt: now,
            },
          })
          await recordEvent(tx, {
            type: "ITEM_RELEASED",
            orderId: order.id,
            tableId,
            actorUserId: session.userId,
            courseId: course.id,
            itemId: item.id,
          })
        }
        await recordEvent(tx, {
          type: "COURSE_PICKED_UP",
          orderId: order.id,
          tableId,
          actorUserId: session.userId,
          courseId: course.id,
        })
        await audit(tx, session.userId, "SERVICE_COURSE_PICKED_UP", {
          tableId,
          tableNumber: table.number,
          courseId: course.id,
          courseName: course.name,
        })
      })
      return { tableId }
    }

    if (!immediateKitchenAwaitingPickup(items)) {
      throw new AppError({
        kind: "conflict",
        code: "COURSE_NOT_READY",
        message: "Nothing is ready for kitchen pickup.",
      })
    }

    await prisma.$transaction(async (tx) => {
      const readyImmediate = order.items.filter(
        (item) =>
          item.courseId == null &&
          isKitchenStation(item.station) &&
          item.productionStatus === "READY",
      )
      for (const item of readyImmediate) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            productionStatus: "PICKED_UP",
            pickedUpAt: now,
          },
        })
      }
      await recordEvent(tx, {
        type: "COURSE_PICKED_UP",
        orderId: order.id,
        tableId,
        actorUserId: session.userId,
        payload: { scope: "immediate" },
      })
      await audit(tx, session.userId, "SERVICE_COURSE_PICKED_UP", {
        tableId,
        tableNumber: table.number,
        scope: "immediate",
      })
    })

    return { tableId }
  })
}

export async function pickupDrinks(
  input: unknown,
): Promise<ActionResult<{ tableId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const { tableId } = tableIdSchema.parse(input)
    const table = await loadTable(tableId)
    const order = requireActiveOrder(table)
    const items = order.items.map(toDomainItem)
    if (deriveBarOrderState(items) !== "READY_FOR_PICKUP") {
      throw new AppError({
        kind: "conflict",
        code: "DRINKS_NOT_READY",
        message: "Drinks are not ready for pickup.",
      })
    }

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      const readyDrinks = order.items.filter(
        (item) =>
          isBarStation(item.station) && item.productionStatus === "READY",
      )
      for (const item of readyDrinks) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            productionStatus: "PICKED_UP",
            pickedUpAt: now,
          },
        })
      }
      await recordEvent(tx, {
        type: "DRINKS_PICKED_UP",
        orderId: order.id,
        tableId,
        actorUserId: session.userId,
      })
      await audit(tx, session.userId, "SERVICE_DRINKS_PICKED_UP", {
        tableId,
        tableNumber: table.number,
      })
    })

    return { tableId }
  })
}

export async function deliverCourse(
  input: unknown,
): Promise<ActionResult<{ tableId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const { tableId } = tableIdSchema.parse(input)
    const table = await loadTable(tableId)
    const order = requireActiveOrder(table)
    const course = order.courses
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .find((entry) => entry.pickedUpAt && !entry.deliveredAt)

    const now = new Date()

    if (course) {
      await prisma.$transaction(async (tx) => {
        await tx.course.update({
          where: { id: course.id },
          data: { deliveredAt: now },
        })
        const courseItems = order.items.filter(
          (item) =>
            item.courseId === course.id &&
            item.productionStatus === "PICKED_UP",
        )
        for (const item of courseItems) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              productionStatus: "DELIVERED",
              deliveredAt: now,
            },
          })
        }
        await recordEvent(tx, {
          type: "COURSE_DELIVERED",
          orderId: order.id,
          tableId,
          actorUserId: session.userId,
          courseId: course.id,
        })
        await audit(tx, session.userId, "SERVICE_COURSE_DELIVERED", {
          tableId,
          tableNumber: table.number,
          courseId: course.id,
          courseName: course.name,
        })
      })
      return { tableId }
    }

    const immediatePickedUp = order.items.filter(
      (item) =>
        item.courseId == null &&
        isKitchenStation(item.station) &&
        item.productionStatus === "PICKED_UP",
    )
    if (immediatePickedUp.length === 0) {
      throw new AppError({
        kind: "conflict",
        code: "COURSE_NOT_PICKED_UP",
        message: "No picked-up course is waiting to be delivered.",
      })
    }

    await prisma.$transaction(async (tx) => {
      for (const item of immediatePickedUp) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            productionStatus: "DELIVERED",
            deliveredAt: now,
          },
        })
      }
      await recordEvent(tx, {
        type: "COURSE_DELIVERED",
        orderId: order.id,
        tableId,
        actorUserId: session.userId,
        payload: { scope: "immediate" },
      })
      await audit(tx, session.userId, "SERVICE_COURSE_DELIVERED", {
        tableId,
        tableNumber: table.number,
        scope: "immediate",
      })
    })

    return { tableId }
  })
}

export async function requestBill(
  input: unknown,
): Promise<ActionResult<{ tableId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const { tableId } = tableIdSchema.parse(input)
    const table = await loadTable(tableId)
    const order = requireActiveOrder(table)
    if (order.billRequestedAt) {
      throw new AppError({
        kind: "conflict",
        code: "BILL_ALREADY_REQUESTED",
        message: "The bill has already been requested.",
      })
    }

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { billRequestedAt: now },
      })
      await recordEvent(tx, {
        type: "BILL_REQUESTED",
        orderId: order.id,
        tableId,
        actorUserId: session.userId,
      })
      await audit(tx, session.userId, "SERVICE_BILL_REQUESTED", {
        tableId,
        tableNumber: table.number,
      })
    })

    return { tableId }
  })
}

export async function completePayment(
  input: unknown,
): Promise<ActionResult<{ tableId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const { tableId } = tableIdSchema.parse(input)
    const table = await loadTable(tableId)
    const order = activeOrderOf(table)
    if (!order?.billRequestedAt || order.paidAt) {
      throw new AppError({
        kind: "conflict",
        code: "PAYMENT_NOT_READY",
        message: "Payment can only be taken after the bill is requested.",
      })
    }

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paidAt: now },
      })
      await recordEvent(tx, {
        type: "PAYMENT_COMPLETED",
        orderId: order.id,
        tableId,
        actorUserId: session.userId,
      })
      await audit(tx, session.userId, "SERVICE_PAYMENT_COMPLETED", {
        tableId,
        tableNumber: table.number,
      })
    })

    return { tableId }
  })
}

export async function clearTable(
  input: unknown,
): Promise<ActionResult<{ tableId: string }>> {
  return withErrorBoundary(async () => {
    const session = await authorize(Actions.floor.write)
    const { tableId } = tableIdSchema.parse(input)
    const table = await loadTable(tableId)
    const order = activeOrderOf(table)
    if (!order?.paidAt || order.closedAt) {
      throw new AppError({
        kind: "conflict",
        code: "TABLE_NOT_PAID",
        message: "Clear the table after payment is complete.",
      })
    }

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { closedAt: now },
      })
      await recordEvent(tx, {
        type: "TABLE_CLEARED",
        orderId: order.id,
        tableId,
        actorUserId: session.userId,
      })
      await audit(tx, session.userId, "SERVICE_TABLE_CLEARED", {
        tableId,
        tableNumber: table.number,
      })
    })

    return { tableId }
  })
}

async function transitionItem(input: {
  itemId: string
  stationWrite: "kitchen" | "bar"
  to: "PREPARING" | "READY" | "UNDO_READY"
}) {
  const action =
    input.stationWrite === "kitchen" ? Actions.kitchen.write : Actions.bar.write
  const session = await authorize(action)
  const item = await prisma.orderItem.findFirst({
    where: { id: input.itemId },
    include: {
      order: {
        include: { table: true },
      },
    },
  })
  if (!item || item.order.closedAt) {
    throw new AppError({
      kind: "not_found",
      code: "ITEM_NOT_FOUND",
      message: "That item could not be found.",
    })
  }

  const expectedBar = input.stationWrite === "bar"
  if (isBarStation(item.station) !== expectedBar) {
    throw new AppError({
      kind: "permission",
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    })
  }

  const now = new Date()
  if (input.to === "PREPARING") {
    if (item.productionStatus !== "QUEUED") {
      throw new AppError({
        kind: "conflict",
        code: "ITEM_NOT_ACTIONABLE",
        message: "Only queued items can be started.",
      })
    }
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          productionStatus: "PREPARING",
          preparingAt: now,
        },
      })
      await recordEvent(tx, {
        type: "ITEM_PREPARING",
        orderId: item.orderId,
        tableId: item.order.tableId,
        actorUserId: session.userId,
        courseId: item.courseId,
        itemId: item.id,
      })
    })
    return { itemId: item.id }
  }

  if (input.to === "READY") {
    if (
      item.productionStatus !== "QUEUED" &&
      item.productionStatus !== "PREPARING"
    ) {
      throw new AppError({
        kind: "conflict",
        code: "ITEM_NOT_ACTIONABLE",
        message: "Only queued or preparing items can be marked ready.",
      })
    }
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          productionStatus: "READY",
          preparingAt: item.preparingAt ?? now,
          readyAt: now,
        },
      })
      await recordEvent(tx, {
        type: "ITEM_READY",
        orderId: item.orderId,
        tableId: item.order.tableId,
        actorUserId: session.userId,
        courseId: item.courseId,
        itemId: item.id,
      })
    })
    return { itemId: item.id }
  }

  if (item.productionStatus !== "READY") {
    throw new AppError({
      kind: "conflict",
      code: "ITEM_NOT_ACTIONABLE",
      message: "Only ready items can be undone.",
    })
  }
  const rollback = item.preparingAt ? "PREPARING" : "QUEUED"
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        productionStatus: rollback,
        readyAt: null,
      },
    })
    await recordEvent(tx, {
      type: "ITEM_UNDO_READY",
      orderId: item.orderId,
      tableId: item.order.tableId,
      actorUserId: session.userId,
      courseId: item.courseId,
      itemId: item.id,
    })
  })
  return { itemId: item.id }
}

export async function startKitchenItem(
  input: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  return withErrorBoundary(async () => {
    const { itemId } = itemIdSchema.parse(input)
    return transitionItem({
      itemId,
      stationWrite: "kitchen",
      to: "PREPARING",
    })
  })
}

export async function markKitchenItemReady(
  input: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  return withErrorBoundary(async () => {
    const { itemId } = itemIdSchema.parse(input)
    return transitionItem({
      itemId,
      stationWrite: "kitchen",
      to: "READY",
    })
  })
}

export async function undoKitchenItemReady(
  input: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  return withErrorBoundary(async () => {
    const { itemId } = itemIdSchema.parse(input)
    return transitionItem({
      itemId,
      stationWrite: "kitchen",
      to: "UNDO_READY",
    })
  })
}

export async function startBarItem(
  input: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  return withErrorBoundary(async () => {
    const { itemId } = itemIdSchema.parse(input)
    return transitionItem({
      itemId,
      stationWrite: "bar",
      to: "PREPARING",
    })
  })
}

export async function markBarItemReady(
  input: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  return withErrorBoundary(async () => {
    const { itemId } = itemIdSchema.parse(input)
    return transitionItem({
      itemId,
      stationWrite: "bar",
      to: "READY",
    })
  })
}

export async function undoBarItemReady(
  input: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  return withErrorBoundary(async () => {
    const { itemId } = itemIdSchema.parse(input)
    return transitionItem({
      itemId,
      stationWrite: "bar",
      to: "UNDO_READY",
    })
  })
}
