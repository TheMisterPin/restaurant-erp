"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
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
} from "@/features/restaurant/components/status-badge"
import type { KitchenTableDTO } from "@/features/restaurant/types/service-types"
import { cn } from "@/lib/utils"

export type KitchenPageProps = {
  loaded: boolean
  canWrite: boolean
  tables: KitchenTableDTO[]
  now: string
  onStart: (itemId: string) => void
  onReady: (itemId: string, name: string) => void
}

export function KitchenPage(props: KitchenPageProps) {
  if (!props.loaded) {
    return (
      <div className="grid gap-3 p-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }

  if (props.tables.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-sm">No kitchen tickets.</p>
    )
  }

  return (
    <ScrollArea className="h-full min-h-0 flex-1">
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {props.tables.map((table) => (
          <article
            key={table.id}
            className="rounded-lg border border-border bg-surface-2 p-4"
          >
            <header className="mb-4 flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Table {table.number}</h2>
              <p className="text-muted-foreground text-sm">
                {table.covers} guests
              </p>
            </header>
            <div className="space-y-4">
              {table.courses.map((course) => (
                <section
                  key={course.id}
                  className={cn(course.upcoming && "opacity-50")}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{course.name}</h3>
                    <StatusBadge
                      label={COURSE_STATE_LABEL[course.kitchenState]}
                      variant={courseStateBadgeVariant(course.kitchenState)}
                    />
                  </div>
                  {course.kitchenTotal > 0 ? (
                    <p className="text-muted-foreground mb-2 text-xs">
                      {course.kitchenReadyCount}/{course.kitchenTotal} ready
                      {course.firedAt
                        ? ` · fired ${waitingLabel(new Date(course.firedAt), new Date(props.now)) ?? ""} ago`
                        : ""}
                    </p>
                  ) : null}
                  <ul className="space-y-2">
                    {course.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-col gap-2 rounded-md border border-border bg-surface-1 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {item.quantity}× {item.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {STATION_LABEL[item.station]} ·{" "}
                            {ITEM_STATUS_LABEL[item.productionStatus]}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <StatusBadge
                            label={ITEM_STATUS_LABEL[item.productionStatus]}
                            variant={itemStateBadgeVariant(item.productionStatus)}
                          />
                          {course.upcoming || !props.canWrite ? null : (
                            <>
                              {item.productionStatus === "QUEUED" ? (
                                <Button
                                  type="button"
                                  size="lg"
                                  className="min-h-12"
                                  onClick={() => props.onStart(item.id)}
                                >
                                  Start
                                </Button>
                              ) : null}
                              {item.productionStatus === "QUEUED" ||
                              item.productionStatus === "PREPARING" ? (
                                <Button
                                  type="button"
                                  size="lg"
                                  className="min-h-12"
                                  variant={
                                    item.productionStatus === "PREPARING"
                                      ? "default"
                                      : "secondary"
                                  }
                                  onClick={() => props.onReady(item.id, item.name)}
                                >
                                  Ready
                                </Button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </ScrollArea>
  )
}
