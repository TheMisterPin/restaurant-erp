export const MIN_GRID_SIZE = 2
export const MAX_GRID_SIZE = 16

export const SEAT_RANGE = {
  square: { min: 2, max: 4 },
  rectangle: { min: 4, max: 8 },
} as const

export type CellShape = keyof typeof SEAT_RANGE

export type CellState =
  | { status: "empty" }
  | { status: "consumed" }
  | { status: "filled"; shape: CellShape; seats: number }

export type SeatMarker = {
  id: string
  left: number
  top: number
  rotate: number
}

export function createEmptyGrid(rows: number, columns: number): CellState[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, (): CellState => ({ status: "empty" })),
  )
}

export function canPlaceRectangle(grid: CellState[][], row: number, col: number): boolean {
  return grid[row + 1]?.[col]?.status === "empty"
}

export function fillCell(
  grid: CellState[][],
  row: number,
  col: number,
  shape: CellShape,
  seats: number,
): CellState[][] {
  return grid.map((line, r) =>
    line.map((cell, c) => {
      if (r === row && c === col) {
        return { status: "filled" as const, shape, seats }
      }
      if (shape === "rectangle" && r === row + 1 && c === col) {
        return { status: "consumed" as const }
      }
      return cell
    }),
  )
}

export function getSeatMarkers(shape: CellShape, seats: number): SeatMarker[] {
  const width = 1
  const height = shape === "rectangle" ? 2 : 1
  const perimeter = 2 * (width + height)

  return Array.from({ length: seats }, (_, i) => {
    const t = ((i + 0.5) / seats) * perimeter
    const point = pointOnPerimeter(t, width, height)
    return {
      id: `seat-${i}`,
      left: point.x,
      top: point.y,
      rotate: point.rotate,
    }
  })
}

function pointOnPerimeter(t: number, width: number, height: number) {
  if (t < width) {
    return { x: (t / width) * 100, y: 0, rotate: 0 }
  }
  if (t < width + height) {
    return { x: 100, y: ((t - width) / height) * 100, rotate: 90 }
  }
  if (t < 2 * width + height) {
    return { x: (1 - (t - width - height) / width) * 100, y: 100, rotate: 180 }
  }
  return { x: 0, y: (1 - (t - 2 * width - height) / height) * 100, rotate: 270 }
}
