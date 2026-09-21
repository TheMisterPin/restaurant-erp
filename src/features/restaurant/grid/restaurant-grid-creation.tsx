"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FillShapeDialog } from "@/features/restaurant/grid-builder/fill-shape-dialog"
import { GridCanvas } from "@/features/restaurant/grid-builder/grid-canvas"
import { GridSetupForm } from "@/features/restaurant/grid-builder/grid-setup-form"
import {
  canPlaceRectangle,
  createEmptyGrid,
  fillCell,
  type CellShape,
  type CellState,
} from "./grid"

export default function RestaurantGridCreation() {
  const [dimensions, setDimensions] = useState<{ columns: number; rows: number } | null>(null)
  const [grid, setGrid] = useState<CellState[][]>([])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  function handleGenerate(columns: number, rows: number) {
    setDimensions({ columns, rows })
    setGrid(createEmptyGrid(rows, columns))
  }

  function handleConfirmFill(shape: CellShape, seats: number) {
    if (!selectedCell) return
    setGrid((current) => fillCell(current, selectedCell.row, selectedCell.col, shape, seats))
    setSelectedCell(null)
  }

  function handleReset() {
    setDimensions(null)
    setGrid([])
    setSelectedCell(null)
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,var(--border)_23px,var(--border)_24px),repeating-linear-gradient(90deg,transparent,transparent_23px,var(--border)_23px,var(--border)_24px)] bg-size-[24px_24px]">
      {!dimensions ? (
        <div className="flex h-full w-full items-center justify-center overflow-y-auto px-4 py-12">
          <GridSetupForm onSubmit={handleGenerate} />
        </div>
      ) : (
        <div className="mx-auto flex h-full w-full max-w-[640px] flex-col gap-4 px-4 py-4">
          <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Grid Builder</p>
              <p className="font-mono text-sm text-foreground">
                {dimensions.columns} × {dimensions.rows}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              New grid
            </Button>
          </div>

          <div className="min-h-0 flex-1">
            <GridCanvas grid={grid} onCellClick={(row, col) => setSelectedCell({ row, col })} />
          </div>

          <p className="shrink-0 text-center text-xs text-muted-foreground">
            Click an empty cell to place a table, then choose how many chairs surround it.
          </p>
        </div>
      )}

      <FillShapeDialog
        open={selectedCell !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCell(null)
        }}
        cell={selectedCell}
        canPlaceRectangle={
          selectedCell ? canPlaceRectangle(grid, selectedCell.row, selectedCell.col) : false
        }
        onConfirm={handleConfirmFill}
      />
    </main>
  )
}
