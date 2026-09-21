/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useId, useState } from "react"
import { Minus, Plus, RectangleVertical, Square as SquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SEAT_RANGE, type CellShape } from "@/features/restaurant/grid/grid"

export function FillShapeDialog({
  open,
  onOpenChange,
  cell,
  canPlaceRectangle,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cell: { row: number; col: number } | null
  canPlaceRectangle: boolean
  onConfirm: (shape: CellShape, seats: number) => void
}) {
  const squareId = useId()
  const rectangleId = useId()
  const [shape, setShape] = useState<CellShape | null>(null)
  const [seats, setSeats] = useState<number>(SEAT_RANGE.square.min)

  useEffect(() => {
    if (open) setShape(null)
  }, [open])

  function selectShape(next: CellShape | null) {
    setShape(next)
    if (next) setSeats(SEAT_RANGE[next].min)
  }

  if (!cell) return null

  const range = shape ? SEAT_RANGE[shape] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Fill cell{" "}
            <span className="font-mono text-muted-foreground">
              R{cell.row + 1} · C{cell.col + 1}
            </span>
          </DialogTitle>
          <DialogDescription>Choose a shape to place at this position.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label
            htmlFor={squareId}
            className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors has-data-checked:border-primary has-data-checked:bg-secondary"
          >
            <Checkbox
              id={squareId}
              checked={shape === "square"}
              onCheckedChange={(checked) => selectShape(checked ? "square" : null)}
              className="mt-0.5"
            />
            <span className="flex flex-1 items-center gap-2.5">
              <SquareIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Square</span>
                <span className="text-xs text-muted-foreground">Fills this single cell</span>
              </span>
            </span>
          </label>

          <label
            htmlFor={rectangleId}
            className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors has-data-checked:border-primary has-data-checked:bg-secondary aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            aria-disabled={!canPlaceRectangle}
          >
            <Checkbox
              id={rectangleId}
              checked={shape === "rectangle"}
              disabled={!canPlaceRectangle}
              onCheckedChange={(checked) => selectShape(checked ? "rectangle" : null)}
              className="mt-0.5"
            />
            <span className="flex flex-1 items-center gap-2.5">
              <RectangleVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Rectangle</span>
                <span className="text-xs text-muted-foreground">
                  {canPlaceRectangle
                    ? "Fills this cell and the one below it"
                    : "No empty cell below to extend into"}
                </span>
              </span>
            </span>
          </label>
        </div>

        {shape && range ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/50 p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Chairs</span>
              <span className="text-xs text-muted-foreground">
                {range.min}–{range.max} seats for a {shape}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={seats <= range.min}
                onClick={() => setSeats((s) => Math.max(range.min, s - 1))}
                aria-label="Remove a chair"
              >
                <Minus className="size-3.5" aria-hidden="true" />
              </Button>
              <span className="w-4 text-center font-mono text-sm text-foreground" aria-live="polite">
                {seats}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={seats >= range.max}
                onClick={() => setSeats((s) => Math.min(range.max, s + 1))}
                aria-label="Add a chair"
              >
                <Plus className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!shape}
            onClick={() => {
              if (shape) onConfirm(shape, seats)
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
