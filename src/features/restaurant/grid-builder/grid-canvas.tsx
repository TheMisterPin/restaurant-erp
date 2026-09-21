"use client"

import { useEffect, useRef, useState } from "react"
import { Armchair, Plus, RectangleVertical, Square as SquareIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { getSeatMarkers, type CellState } from "@/features/restaurant/grid/grid"

const GAP_PX = 2
const MIN_CELL_PX = 22
const MAX_CELL_PX = 68

export function GridCanvas({
  grid,
  onCellClick,
}: {
  grid: CellState[][]
  onCellClick: (row: number, col: number) => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(MAX_CELL_PX)

  const rows = grid.length
  const columns = grid[0]?.length ?? 0

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || columns === 0) return

    const measure = (width: number) => {
      const raw = (width - GAP_PX * (columns - 1)) / columns
      setCellSize(Math.max(MIN_CELL_PX, Math.min(MAX_CELL_PX, Math.floor(raw))))
    }

    measure(wrapper.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) measure(width)
    })
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [columns])

  return (
    <div ref={wrapperRef} className="h-full w-full overflow-auto scrollbar-hide">
      <div className="w-full">
        <div className="flex">
          <div style={{ width: cellSize }} aria-hidden="true" />
          <div
            className="flex flex-1 font-mono text-[10px] text-muted-foreground"
            style={{ gap: GAP_PX }}
          >
            {Array.from({ length: columns }, (_, col) => (
              <span key={col} style={{ width: cellSize }} className="shrink-0 text-center">
                {col + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="flex">
          <div
            className="flex flex-col font-mono text-[10px] text-muted-foreground"
            style={{ gap: GAP_PX }}
          >
            {Array.from({ length: rows }, (_, row) => (
              <span
                key={row}
                style={{ height: cellSize, width: cellSize }}
                className="flex shrink-0 items-center justify-center"
              >
                {row + 1}
              </span>
            ))}
          </div>

          <div
            role="grid"
            aria-label={`Grid with ${rows} rows and ${columns} columns`}
            className="grid shrink-0 rounded-md bg-border p-0.5"
            style={{
              gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              gap: GAP_PX,
            }}
          >
            {grid.flatMap((line, row) =>
              line.map((cell, col) => {
                if (cell.status === "consumed") return null

                const gridColumn = col + 1
                const gridRow =
                  cell.status === "filled" && cell.shape === "rectangle"
                    ? `${row + 1} / span 2`
                    : row + 1

                if (cell.status === "empty") {
                  return (
                    <button
                      key={`${row}-${col}`}
                      type="button"
                      role="gridcell"
                      onClick={() => onCellClick(row, col)}
                      aria-label={`Fill cell, row ${row + 1}, column ${col + 1}`}
                      style={{ gridColumn, gridRow }}
                      className="group flex items-center justify-center bg-card outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <Plus
                        className="size-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60"
                        aria-hidden="true"
                      />
                    </button>
                  )
                }

                const Icon = cell.shape === "square" ? SquareIcon : RectangleVertical
                const seatSize = Math.max(14, Math.round(cellSize * 0.34))

                return (
                  <div
                    key={`${row}-${col}`}
                    role="gridcell"
                    aria-label={`Row ${row + 1}, column ${col + 1}, filled with a ${cell.shape}, ${cell.seats} ${cell.seats === 1 ? "chair" : "chairs"}`}
                    style={{ gridColumn, gridRow }}
                    className="relative bg-card"
                  >
                    <div
                      className={cn(
                        "absolute inset-1 flex items-center justify-center rounded-md bg-accent ring-1 ring-inset ring-accent-foreground/10",
                      )}
                    >
                      <Icon className="size-3.5 text-accent-foreground/70" aria-hidden="true" />
                    </div>

                    {getSeatMarkers(cell.shape, cell.seats).map((seat) => (
                      <div
                        key={seat.id}
                        aria-hidden="true"
                        className="absolute z-10 flex items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
                        style={{
                          left: `${seat.left}%`,
                          top: `${seat.top}%`,
                          width: seatSize,
                          height: seatSize,
                          transform: `translate(-50%, -50%) rotate(${seat.rotate}deg)`,
                        }}
                      >
                        <Armchair className="size-[65%] text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
