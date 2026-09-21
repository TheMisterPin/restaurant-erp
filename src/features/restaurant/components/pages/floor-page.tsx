"use client"

import { useEffect, useState } from "react"
import {
  Banknote,
  Check,
  Flame,
  Printer,
  Receipt,
  Truck,
  UtensilsCrossed,
  Wine,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  COURSE_STATE_LABEL,
  ITEM_STATUS_LABEL,
  STATION_LABEL,
  waitingLabel,
} from "@/features/restaurant/domain/lifecycle"
import {
  courseStateBadgeVariant,
  itemStateBadgeVariant,
  StatusBadge,
  tableStateBadgeVariant,
} from "@/features/restaurant/components/status-badge"
import type { ServiceTableDTO } from "@/features/restaurant/types/service-types"
import { cn } from "@/lib/utils"

export type FloorPageProps = {
  loaded: boolean
  canWrite: boolean
  tables: ServiceTableDTO[]
  selectedTable: ServiceTableDTO | null
  now: string
  onSelectTable: (tableId: string | null) => void
  onFireNextCourse: () => void
  onAddFood: () => void
  onAddDrinks: () => void
  onPickupKitchen: () => void
  onPickupDrinks: () => void
  onDeliverCourse: () => void
  onPrintBill: () => void
  onTakePayment: () => void
  onClearTable: () => void
}

function TableCard({
  table,
  selected,
  now,
  onSelect,
}: {
  table: ServiceTableDTO
  selected: boolean
  now: string
  onSelect: () => void
}) {
  const wait = waitingLabel(
    table.submittedAt ? new Date(table.submittedAt) : null,
    new Date(now),
  )
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-surface-2 p-4 text-left transition-colors",
        selected
          ? "border-border-strong bg-surface-selected"
          : "border-border hover:bg-surface-3",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">Table {table.number}</p>
          <p className="text-muted-foreground text-sm">
            {table.order?.covers ?? table.seatCount} guests
          </p>
        </div>
        <StatusBadge
          label={table.tableStateLabel}
          variant={tableStateBadgeVariant(table.tableState)}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
        {wait ? <span>Waiting {wait}</span> : null}
        {table.kitchenTotal > 0 ? (
          <span>
            Kitchen {table.kitchenReadyCount}/{table.kitchenTotal}
          </span>
        ) : null}
        {table.barTotal > 0 ? (
          <span>
            Bar {table.barReadyCount}/{table.barTotal}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function TableDetail({
  table,
  canWrite,
  now,
  onFireNextCourse,
  onAddFood,
  onAddDrinks,
  onPickupKitchen,
  onPickupDrinks,
  onDeliverCourse,
  onPrintBill,
  onTakePayment,
  onClearTable,
}: {
  table: ServiceTableDTO
  canWrite: boolean
  now: string
} & Pick<
  FloorPageProps,
  | "onFireNextCourse"
  | "onAddFood"
  | "onAddDrinks"
  | "onPickupKitchen"
  | "onPickupDrinks"
  | "onDeliverCourse"
  | "onPrintBill"
  | "onTakePayment"
  | "onClearTable"
>) {
  const actions = table.actions
  const wait = waitingLabel(
    table.submittedAt ? new Date(table.submittedAt) : null,
    new Date(now),
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Table {table.number}</h2>
            <p className="text-muted-foreground text-sm">
              {table.order?.covers ?? table.seatCount} guests
              {wait ? ` · waiting ${wait}` : ""}
            </p>
          </div>
          <StatusBadge
            label={table.tableStateLabel}
            variant={tableStateBadgeVariant(table.tableState)}
          />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {!table.order ? (
            <p className="text-muted-foreground text-sm">No active order.</p>
          ) : (
            <>
              {table.order.immediateItems.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Immediate</h3>
                  <ul className="space-y-2">
                    {table.order.immediateItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-1 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {item.quantity}× {item.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {STATION_LABEL[item.station]}
                          </p>
                        </div>
                        <StatusBadge
                          label={ITEM_STATUS_LABEL[item.productionStatus]}
                          variant={itemStateBadgeVariant(item.productionStatus)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {table.order.courses.map((course) => (
                <section key={course.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{course.name}</h3>
                    <StatusBadge
                      label={COURSE_STATE_LABEL[course.kitchenState]}
                      variant={courseStateBadgeVariant(course.kitchenState)}
                    />
                  </div>
                  {course.kitchenTotal > 0 ? (
                    <p className="text-muted-foreground mb-2 text-xs">
                      Kitchen {course.kitchenReadyCount}/{course.kitchenTotal} ready
                      {course.firedAt
                        ? ` · fired ${waitingLabel(new Date(course.firedAt), new Date(now)) ?? ""} ago`
                        : ""}
                    </p>
                  ) : null}
                  <ul className="space-y-2">
                    {course.items.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md border px-3 py-2",
                          item.productionStatus === "HELD"
                            ? "border-border bg-surface-1 opacity-70"
                            : "border-border bg-surface-1",
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {item.quantity}× {item.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {STATION_LABEL[item.station]}
                          </p>
                        </div>
                        <StatusBadge
                          label={ITEM_STATUS_LABEL[item.productionStatus]}
                          variant={itemStateBadgeVariant(item.productionStatus)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
      <div className="grid grid-cols-2 gap-2 border-t border-border bg-surface-1 p-3 sm:grid-cols-3">
        <Button
          type="button"
          disabled={!canWrite || !actions.fireNextCourse}
          onClick={onFireNextCourse}
        >
          <Flame className="h-4 w-4" />
          Fire next
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canWrite || !actions.addFood}
          onClick={onAddFood}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Add food
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canWrite || !actions.addDrinks}
          onClick={onAddDrinks}
        >
          <Wine className="h-4 w-4" />
          Add drinks
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canWrite || !actions.pickupKitchen}
          onClick={onPickupKitchen}
        >
          <Check className="h-4 w-4" />
          Pickup food
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canWrite || !actions.pickupDrinks}
          onClick={onPickupDrinks}
        >
          <Wine className="h-4 w-4" />
          Pickup drinks
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canWrite || !actions.deliverCourse}
          onClick={onDeliverCourse}
        >
          <Truck className="h-4 w-4" />
          Deliver
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canWrite || !actions.printBill}
          onClick={onPrintBill}
        >
          <Printer className="h-4 w-4" />
          Print bill
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canWrite || !actions.takePayment}
          onClick={onTakePayment}
        >
          <Banknote className="h-4 w-4" />
          Payment
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canWrite || !actions.clearTable}
          onClick={onClearTable}
        >
          <Receipt className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}

export function FloorPage(props: FloorPageProps) {
  const [desktop, setDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)")
    const update = () => setDesktop(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  if (!props.loaded) {
    return (
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
    )
  }

  const detail = props.selectedTable ? (
    <TableDetail
      table={props.selectedTable}
      canWrite={props.canWrite}
      now={props.now}
      onFireNextCourse={props.onFireNextCourse}
      onAddFood={props.onAddFood}
      onAddDrinks={props.onAddDrinks}
      onPickupKitchen={props.onPickupKitchen}
      onPickupDrinks={props.onPickupDrinks}
      onDeliverCourse={props.onDeliverCourse}
      onPrintBill={props.onPrintBill}
      onTakePayment={props.onTakePayment}
      onClearTable={props.onClearTable}
    />
  ) : (
    <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
      Select a table
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {props.tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              selected={props.selectedTable?.id === table.id}
              now={props.now}
              onSelect={() =>
                props.onSelectTable(
                  props.selectedTable?.id === table.id ? null : table.id,
                )
              }
            />
          ))}
        </div>
      </div>
      <aside className="hidden w-104 shrink-0 border-l border-border bg-surface-1 lg:block">
        {detail}
      </aside>
      <Sheet
        open={!desktop && Boolean(props.selectedTable)}
        onOpenChange={(open) => {
          if (!open) props.onSelectTable(null)
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 lg:hidden sm:max-w-md"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {props.selectedTable
                ? `Table ${props.selectedTable.number}`
                : "Table"}
            </SheetTitle>
          </SheetHeader>
          {props.selectedTable ? detail : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
