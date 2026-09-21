"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ITEM_STATUS_LABEL,
  waitingLabel,
} from "@/features/restaurant/domain/lifecycle"
import {
  itemStateBadgeVariant,
  StatusBadge,
} from "@/features/restaurant/components/status-badge"
import type { BarTableDTO } from "@/features/restaurant/types/service-types"

export type BarPageProps = {
  loaded: boolean
  canWrite: boolean
  tables: BarTableDTO[]
  now: string
  onStart: (itemId: string) => void
  onReady: (itemId: string, name: string) => void
}

export function BarPage(props: BarPageProps) {
  if (!props.loaded) {
    return (
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }

  if (props.tables.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-sm">No active drinks.</p>
    )
  }

  const [first, ...rest] = props.tables

  return (
    <ScrollArea className="h-full min-h-0 flex-1">
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {first ? (
          <BarCard
            key={first.id}
            table={first}
            now={props.now}
            canWrite={props.canWrite}
            expanded
            onStart={props.onStart}
            onReady={props.onReady}
          />
        ) : null}
        {rest.map((table) => (
          <BarCard
            key={table.id}
            table={table}
            now={props.now}
            canWrite={props.canWrite}
            expanded={table.barState === "READY_FOR_PICKUP"}
            onStart={props.onStart}
            onReady={props.onReady}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

function BarCard({
  table,
  now,
  canWrite,
  expanded,
  onStart,
  onReady,
}: {
  table: BarTableDTO
  now: string
  canWrite: boolean
  expanded: boolean
  onStart: (itemId: string) => void
  onReady: (itemId: string, name: string) => void
}) {
  return (
    <article className="rounded-lg border border-border bg-surface-2 p-4">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Table {table.number}</h2>
          <p className="text-muted-foreground text-sm">{table.covers} guests</p>
        </div>
        <StatusBadge
          label={
            table.barState === "READY_FOR_PICKUP"
              ? "Ready for pickup"
              : `${table.readyCount}/${table.total} ready`
          }
          variant={
            table.barState === "READY_FOR_PICKUP" ? "warning" : "info"
          }
        />
      </header>
      {expanded ? (
        <ul className="space-y-2">
          {table.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-surface-1 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {item.quantity}× {item.name}
                </p>
                <StatusBadge
                  label={ITEM_STATUS_LABEL[item.productionStatus]}
                  variant={itemStateBadgeVariant(item.productionStatus)}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Released{" "}
                {waitingLabel(
                  item.releasedAt ? new Date(item.releasedAt) : null,
                  new Date(now),
                ) ?? "just now"}
              </p>
              {canWrite && item.productionStatus !== "READY" ? (
                <div className="flex gap-2">
                  {item.productionStatus === "QUEUED" ? (
                    <Button
                      type="button"
                      size="lg"
                      className="min-h-12 flex-1"
                      variant="secondary"
                      onClick={() => onStart(item.id)}
                    >
                      Start
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-12 flex-1"
                    onClick={() => onReady(item.id, item.name)}
                  >
                    Ready
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary">
          {table.readyCount}/{table.total} ready
        </p>
      )}
    </article>
  )
}
