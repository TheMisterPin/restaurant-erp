import assert from "node:assert/strict"
import { test } from "node:test"

import {
  deriveBarOrderState,
  deriveCourseKitchenState,
  deriveFloorActions,
  deriveTableState,
  fohAlertsFromDiff,
  initialReleaseForItem,
  nextUnfiredCourse,
  releaseBarItemsOnKitchenPickup,
  releaseKitchenItemsOnFire,
} from "./lifecycle"
import type { DomainCourse, DomainItem, DomainOrder } from "./types"

function minutesAgo(minutes: number, now = new Date("2026-09-21T20:00:00Z")) {
  return new Date(now.getTime() - minutes * 60_000)
}

function course(overrides: Partial<DomainCourse> = {}): DomainCourse {
  return {
    id: "course-mains",
    name: "Mains",
    sequence: 2,
    firedAt: null,
    pickedUpAt: null,
    deliveredAt: null,
    ...overrides,
  }
}

function item(overrides: Partial<DomainItem> = {}): DomainItem {
  const now = new Date("2026-09-21T20:00:00Z")
  return {
    id: "item-1",
    courseId: "course-mains",
    name: "Tagliata",
    kind: "FOOD",
    station: "GRILL",
    quantity: 1,
    productionStatus: "QUEUED",
    orderedAt: minutesAgo(30, now),
    releasedAt: minutesAgo(12, now),
    preparingAt: null,
    readyAt: null,
    pickedUpAt: null,
    deliveredAt: null,
    ...overrides,
  }
}

function order(overrides: Partial<DomainOrder> = {}): DomainOrder {
  return {
    id: "order-1",
    covers: 4,
    submittedAt: minutesAgo(30),
    billRequestedAt: null,
    paidAt: null,
    closedAt: null,
    ...overrides,
  }
}

test("kitchen course ready is derived when every kitchen item is ready", () => {
  const mains = course({ firedAt: minutesAgo(12) })
  const items = [
    item({ id: "steak", productionStatus: "READY" }),
    item({
      id: "fish",
      name: "Branzino",
      station: "HOT_KITCHEN",
      productionStatus: "READY",
    }),
    item({
      id: "wine",
      name: "Vino",
      kind: "DRINK",
      station: "BAR",
      productionStatus: "HELD",
      releasedAt: null,
    }),
  ]

  assert.equal(deriveCourseKitchenState(mains, items), "READY_FOR_PICKUP")
})

test("kitchen course stays preparing while any kitchen item is unfinished", () => {
  const mains = course({ firedAt: minutesAgo(12) })
  const items = [
    item({ id: "steak", productionStatus: "READY" }),
    item({
      id: "fish",
      name: "Branzino",
      station: "HOT_KITCHEN",
      productionStatus: "PREPARING",
    }),
  ]

  assert.equal(deriveCourseKitchenState(mains, items), "PREPARING")
})

test("unfired courses are not kitchen-actionable", () => {
  const desserts = course({
    id: "course-desserts",
    name: "Desserts",
    sequence: 3,
    firedAt: null,
  })
  const items = [
    item({
      id: "tiramisu",
      courseId: "course-desserts",
      name: "Tiramisù",
      station: "COLD_KITCHEN",
      productionStatus: "HELD",
      releasedAt: null,
    }),
  ]

  assert.equal(deriveCourseKitchenState(desserts, items), "NOT_FIRED")
})

test("course-associated drinks stay held until kitchen pickup", () => {
  const now = new Date("2026-09-21T20:00:00Z")
  const mains = course({ firedAt: minutesAgo(12, now) })
  const heldWine = item({
    id: "wine",
    name: "Vino",
    kind: "DRINK",
    station: "BAR",
    productionStatus: "HELD",
    releasedAt: null,
  })

  const afterFire = releaseKitchenItemsOnFire([heldWine], mains.id, now)
  assert.equal(afterFire[0]?.productionStatus, "HELD")
  assert.equal(afterFire[0]?.releasedAt, null)

  const afterPickup = releaseBarItemsOnKitchenPickup(afterFire, mains.id, now)
  assert.equal(afterPickup[0]?.productionStatus, "QUEUED")
  assert.equal(afterPickup[0]?.releasedAt?.toISOString(), now.toISOString())
})

test("independent drinks queue immediately", () => {
  const now = new Date("2026-09-21T20:00:00Z")
  const release = initialReleaseForItem({
    station: "BAR",
    course: null,
    now,
  })
  assert.equal(release.productionStatus, "QUEUED")
  assert.equal(release.releasedAt?.toISOString(), now.toISOString())
})

test("firing a course does not fire the next one", () => {
  const starters = course({
    id: "starters",
    name: "Starters",
    sequence: 1,
    firedAt: minutesAgo(20),
  })
  const mains = course({
    id: "mains",
    name: "Mains",
    sequence: 2,
    firedAt: null,
  })
  const desserts = course({
    id: "desserts",
    name: "Desserts",
    sequence: 3,
    firedAt: null,
  })

  assert.equal(nextUnfiredCourse([starters, mains, desserts])?.id, "mains")
  const afterMainsFired = [
    starters,
    { ...mains, firedAt: new Date() },
    desserts,
  ]
  assert.equal(nextUnfiredCourse(afterMainsFired)?.id, "desserts")
})

test("bar order ready is derived from active drinks only", () => {
  const items = [
    item({
      id: "beer",
      courseId: null,
      name: "Birra",
      kind: "DRINK",
      station: "BAR",
      productionStatus: "READY",
    }),
    item({
      id: "wine",
      name: "Vino",
      kind: "DRINK",
      station: "BAR",
      productionStatus: "HELD",
      releasedAt: null,
    }),
  ]

  assert.equal(deriveBarOrderState(items), "READY_FOR_PICKUP")
})

test("table is awaiting pickup when a kitchen course is ready", () => {
  const mains = course({ firedAt: minutesAgo(12) })
  const items = [item({ productionStatus: "READY" })]
  assert.equal(deriveTableState(order(), [mains], items), "AWAITING_PICKUP")
})

test("Fire Next Course is off when every course is already fired", () => {
  const mains = course({ firedAt: minutesAgo(12) })
  const flags = deriveFloorActions(order(), [mains], [
    item({ productionStatus: "QUEUED" }),
  ])
  assert.equal(flags.fireNextCourse, false)
  assert.equal(flags.addFood, true)
})

test("FOH is alerted when a kitchen course becomes ready", () => {
  const alerts = fohAlertsFromDiff({
    prevCourses: [
      {
        tableNumber: 12,
        courseId: "mains",
        courseName: "Mains",
        kitchenState: "PREPARING",
      },
    ],
    nextCourses: [
      {
        tableNumber: 12,
        courseId: "mains",
        courseName: "Mains",
        kitchenState: "READY_FOR_PICKUP",
      },
    ],
    prevBars: [],
    nextBars: [],
  })

  assert.deepEqual(alerts, [
    {
      key: "kitchen-ready:mains",
      message: "Table 12 — Mains ready for pickup",
    },
  ])
})
