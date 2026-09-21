import type {
  CatalogCategory,
  CatalogItemKind,
  ItemProductionStatus,
  PrismaClient,
  ProductionStation,
} from "../src/generated/prisma/client"

type SeedCatalogItem = {
  name: string
  kind: CatalogItemKind
  category: CatalogCategory
  station: ProductionStation
}

export const SERVICE_CATALOG: SeedCatalogItem[] = [
  {
    name: "Arancini",
    kind: "FOOD",
    category: "STARTER",
    station: "HOT_KITCHEN",
  },
  {
    name: "Vitello Tonnato",
    kind: "FOOD",
    category: "STARTER",
    station: "COLD_KITCHEN",
  },
  {
    name: "Insalata Mista",
    kind: "FOOD",
    category: "STARTER",
    station: "COLD_KITCHEN",
  },
  {
    name: "Tagliatelle al Ragù",
    kind: "FOOD",
    category: "MAIN",
    station: "HOT_KITCHEN",
  },
  {
    name: "Tagliata di Manzo",
    kind: "FOOD",
    category: "MAIN",
    station: "GRILL",
  },
  {
    name: "Branzino al Forno",
    kind: "FOOD",
    category: "MAIN",
    station: "HOT_KITCHEN",
  },
  {
    name: "Tiramisù",
    kind: "FOOD",
    category: "DESSERT",
    station: "COLD_KITCHEN",
  },
  {
    name: "Panna Cotta",
    kind: "FOOD",
    category: "DESSERT",
    station: "COLD_KITCHEN",
  },
  {
    name: "Cannoli",
    kind: "FOOD",
    category: "DESSERT",
    station: "COLD_KITCHEN",
  },
  { name: "Acqua", kind: "DRINK", category: "DRINK", station: "BAR" },
  { name: "Birra", kind: "DRINK", category: "DRINK", station: "BAR" },
  {
    name: "Vino rosso al calice",
    kind: "DRINK",
    category: "DRINK",
    station: "BAR",
  },
  { name: "Negroni", kind: "DRINK", category: "DRINK", station: "BAR" },
  { name: "Fontana", kind: "DRINK", category: "DRINK", station: "BAR" },
]

function minutesAgo(minutes: number, now: Date) {
  return new Date(now.getTime() - minutes * 60_000)
}

async function ensureCatalog(prisma: PrismaClient) {
  const byName = new Map<string, { id: string }>()
  for (const item of SERVICE_CATALOG) {
    const row = await prisma.catalogItem.upsert({
      where: { name: item.name },
      update: {
        kind: item.kind,
        category: item.category,
        station: item.station,
        isActive: true,
        deletedAt: null,
      },
      create: item,
    })
    byName.set(item.name, row)
  }
  return byName
}

async function ensureTables(prisma: PrismaClient, locationId: string) {
  const specs = [
    { number: 1, seatCount: 4 },
    { number: 2, seatCount: 2 },
    { number: 3, seatCount: 6 },
  ]
  const tables = []
  for (const spec of specs) {
    const existing = await prisma.diningTable.findFirst({
      where: { locationId, number: spec.number, deletedAt: null },
    })
    if (existing) {
      tables.push(
        await prisma.diningTable.update({
          where: { id: existing.id },
          data: { seatCount: spec.seatCount, isActive: true, deletedAt: null },
        }),
      )
      continue
    }
    tables.push(
      await prisma.diningTable.create({
        data: {
          locationId,
          number: spec.number,
          seatCount: spec.seatCount,
          isActive: true,
        },
      }),
    )
  }
  return tables
}

type LineInput = {
  name: string
  courseName?: string
  status: ItemProductionStatus
  orderedAt: Date
  releasedAt?: Date | null
  preparingAt?: Date | null
  readyAt?: Date | null
  pickedUpAt?: Date | null
  deliveredAt?: Date | null
}

async function createDemoOrder(
  prisma: PrismaClient,
  input: {
    tableId: string
    actorUserId: string
    covers: number
    now: Date
    submittedAt: Date
    courses: Array<{
      name: string
      sequence: number
      firedAt: Date | null
      pickedUpAt: Date | null
      deliveredAt: Date | null
    }>
    lines: LineInput[]
    catalog: Map<string, { id: string }>
  },
) {
  await prisma.order.deleteMany({ where: { tableId: input.tableId } })

  const order = await prisma.order.create({
    data: {
      tableId: input.tableId,
      covers: input.covers,
      submittedAt: input.submittedAt,
    },
  })

  const courseIds = new Map<string, string>()
  for (const course of input.courses) {
    const row = await prisma.course.create({
      data: {
        orderId: order.id,
        name: course.name,
        sequence: course.sequence,
        firedAt: course.firedAt,
        pickedUpAt: course.pickedUpAt,
        deliveredAt: course.deliveredAt,
      },
    })
    courseIds.set(course.name, row.id)
  }

  for (const line of input.lines) {
    const catalogItem = input.catalog.get(line.name)
    if (!catalogItem) {
      throw new Error(`Missing catalog item ${line.name}`)
    }
    const catalog = SERVICE_CATALOG.find((item) => item.name === line.name)
    if (!catalog) {
      throw new Error(`Missing catalog spec ${line.name}`)
    }
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        courseId: line.courseName ? (courseIds.get(line.courseName) ?? null) : null,
        catalogItemId: catalogItem.id,
        name: catalog.name,
        kind: catalog.kind,
        station: catalog.station,
        quantity: 1,
        productionStatus: line.status,
        orderedAt: line.orderedAt,
        releasedAt: line.releasedAt ?? null,
        preparingAt: line.preparingAt ?? null,
        readyAt: line.readyAt ?? null,
        pickedUpAt: line.pickedUpAt ?? null,
        deliveredAt: line.deliveredAt ?? null,
      },
    })
  }

  await prisma.serviceEvent.create({
    data: {
      type: "ORDER_SUBMITTED",
      orderId: order.id,
      tableId: input.tableId,
      actorUserId: input.actorUserId,
      createdAt: input.submittedAt,
    },
  })

  return order
}

export async function seedServiceDemo(
  prisma: PrismaClient,
  input: { insideLocationId: string; actorUserId: string },
) {
  const now = new Date()
  const catalog = await ensureCatalog(prisma)
  const tables = await ensureTables(prisma, input.insideLocationId)
  const table1 = tables.find((table) => table.number === 1)
  const table2 = tables.find((table) => table.number === 2)
  const table3 = tables.find((table) => table.number === 3)
  if (!table1 || !table2 || !table3) {
    throw new Error("Failed to seed dining tables")
  }

  await createDemoOrder(prisma, {
    tableId: table1.id,
    actorUserId: input.actorUserId,
    covers: 4,
    now,
    submittedAt: minutesAgo(22, now),
    courses: [
      {
        name: "Starters",
        sequence: 1,
        firedAt: minutesAgo(18, now),
        pickedUpAt: null,
        deliveredAt: null,
      },
      {
        name: "Mains",
        sequence: 2,
        firedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
      },
      {
        name: "Desserts",
        sequence: 3,
        firedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
      },
    ],
    catalog,
    lines: [
      {
        name: "Arancini",
        courseName: "Starters",
        status: "READY",
        orderedAt: minutesAgo(22, now),
        releasedAt: minutesAgo(18, now),
        preparingAt: minutesAgo(14, now),
        readyAt: minutesAgo(6, now),
      },
      {
        name: "Vitello Tonnato",
        courseName: "Starters",
        status: "PREPARING",
        orderedAt: minutesAgo(22, now),
        releasedAt: minutesAgo(18, now),
        preparingAt: minutesAgo(8, now),
      },
      {
        name: "Insalata Mista",
        courseName: "Starters",
        status: "READY",
        orderedAt: minutesAgo(22, now),
        releasedAt: minutesAgo(18, now),
        preparingAt: minutesAgo(12, now),
        readyAt: minutesAgo(4, now),
      },
      {
        name: "Tagliatelle al Ragù",
        courseName: "Mains",
        status: "HELD",
        orderedAt: minutesAgo(22, now),
        releasedAt: null,
      },
      {
        name: "Tagliata di Manzo",
        courseName: "Mains",
        status: "HELD",
        orderedAt: minutesAgo(22, now),
        releasedAt: null,
      },
      {
        name: "Tiramisù",
        courseName: "Desserts",
        status: "HELD",
        orderedAt: minutesAgo(22, now),
        releasedAt: null,
      },
      {
        name: "Birra",
        status: "QUEUED",
        orderedAt: minutesAgo(20, now),
        releasedAt: minutesAgo(20, now),
      },
    ],
  })

  await createDemoOrder(prisma, {
    tableId: table2.id,
    actorUserId: input.actorUserId,
    covers: 2,
    now,
    submittedAt: minutesAgo(40, now),
    courses: [
      {
        name: "Starters",
        sequence: 1,
        firedAt: minutesAgo(38, now),
        pickedUpAt: minutesAgo(28, now),
        deliveredAt: minutesAgo(26, now),
      },
      {
        name: "Mains",
        sequence: 2,
        firedAt: minutesAgo(12, now),
        pickedUpAt: null,
        deliveredAt: null,
      },
      {
        name: "Desserts",
        sequence: 3,
        firedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
      },
    ],
    catalog,
    lines: [
      {
        name: "Arancini",
        courseName: "Starters",
        status: "DELIVERED",
        orderedAt: minutesAgo(40, now),
        releasedAt: minutesAgo(38, now),
        preparingAt: minutesAgo(36, now),
        readyAt: minutesAgo(30, now),
        pickedUpAt: minutesAgo(28, now),
        deliveredAt: minutesAgo(26, now),
      },
      {
        name: "Tagliata di Manzo",
        courseName: "Mains",
        status: "PREPARING",
        orderedAt: minutesAgo(40, now),
        releasedAt: minutesAgo(12, now),
        preparingAt: minutesAgo(8, now),
      },
      {
        name: "Branzino al Forno",
        courseName: "Mains",
        status: "QUEUED",
        orderedAt: minutesAgo(40, now),
        releasedAt: minutesAgo(12, now),
      },
      {
        name: "Vino rosso al calice",
        courseName: "Mains",
        status: "HELD",
        orderedAt: minutesAgo(40, now),
        releasedAt: null,
      },
      {
        name: "Panna Cotta",
        courseName: "Desserts",
        status: "HELD",
        orderedAt: minutesAgo(40, now),
        releasedAt: null,
      },
    ],
  })

  await createDemoOrder(prisma, {
    tableId: table3.id,
    actorUserId: input.actorUserId,
    covers: 6,
    now,
    submittedAt: minutesAgo(55, now),
    courses: [
      {
        name: "Starters",
        sequence: 1,
        firedAt: minutesAgo(52, now),
        pickedUpAt: minutesAgo(40, now),
        deliveredAt: minutesAgo(38, now),
      },
      {
        name: "Mains",
        sequence: 2,
        firedAt: minutesAgo(18, now),
        pickedUpAt: null,
        deliveredAt: null,
      },
      {
        name: "Desserts",
        sequence: 3,
        firedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
      },
    ],
    catalog,
    lines: [
      {
        name: "Insalata Mista",
        courseName: "Starters",
        status: "DELIVERED",
        orderedAt: minutesAgo(55, now),
        releasedAt: minutesAgo(52, now),
        preparingAt: minutesAgo(50, now),
        readyAt: minutesAgo(42, now),
        pickedUpAt: minutesAgo(40, now),
        deliveredAt: minutesAgo(38, now),
      },
      {
        name: "Tagliatelle al Ragù",
        courseName: "Mains",
        status: "READY",
        orderedAt: minutesAgo(55, now),
        releasedAt: minutesAgo(18, now),
        preparingAt: minutesAgo(14, now),
        readyAt: minutesAgo(3, now),
      },
      {
        name: "Tagliata di Manzo",
        courseName: "Mains",
        status: "READY",
        orderedAt: minutesAgo(55, now),
        releasedAt: minutesAgo(18, now),
        preparingAt: minutesAgo(12, now),
        readyAt: minutesAgo(3, now),
      },
      {
        name: "Branzino al Forno",
        courseName: "Mains",
        status: "READY",
        orderedAt: minutesAgo(55, now),
        releasedAt: minutesAgo(18, now),
        preparingAt: minutesAgo(10, now),
        readyAt: minutesAgo(3, now),
      },
      {
        name: "Vino rosso al calice",
        courseName: "Mains",
        status: "HELD",
        orderedAt: minutesAgo(55, now),
        releasedAt: null,
      },
      {
        name: "Cannoli",
        courseName: "Desserts",
        status: "HELD",
        orderedAt: minutesAgo(55, now),
        releasedAt: null,
      },
    ],
  })

  return { tables: tables.length, catalog: catalog.size }
}
