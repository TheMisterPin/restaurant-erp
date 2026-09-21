"use client"

import { useId, useState } from "react"
import { Grid3x3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "@/features/restaurant/grid/grid"

function clampDimension(value: string) {
  const parsed = Math.round(Number(value))
  if (!Number.isFinite(parsed)) return MIN_GRID_SIZE
  return Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, parsed))
}

export function GridSetupForm({
  onSubmit,
}: {
  onSubmit: (columns: number, rows: number) => void
}) {
  const columnsId = useId()
  const rowsId = useId()
  const [columns, setColumns] = useState("6")
  const [rows, setRows] = useState("6")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(clampDimension(columns), clampDimension(rows))
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
          <Grid3x3 className="size-4.5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
            Grid Builder
          </h1>
          <p className="text-xs text-muted-foreground">Define the plot, then start filling it in</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={columnsId} className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Columns
            </Label>
            <Input
              id={columnsId}
              type="number"
              inputMode="numeric"
              min={MIN_GRID_SIZE}
              max={MAX_GRID_SIZE}
              value={columns}
              onChange={(event) => setColumns(event.target.value)}
              className="font-mono"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={rowsId} className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Rows
            </Label>
            <Input
              id={rowsId}
              type="number"
              inputMode="numeric"
              min={MIN_GRID_SIZE}
              max={MAX_GRID_SIZE}
              value={rows}
              onChange={(event) => setRows(event.target.value)}
              className="font-mono"
              required
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {MIN_GRID_SIZE}–{MAX_GRID_SIZE} per side.
        </p>

        <Button type="submit" className="mt-1 w-full">
          Generate grid
        </Button>
      </form>
    </div>
  )
}
