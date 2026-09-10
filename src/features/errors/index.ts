export type {
  ActionResult,
  ErrorDTO,
  ErrorKind,
} from "@/features/errors/dto"

export { ErrorBoundary } from "@/features/errors/error-boundary"
export { ErrorProvider, useErrorContext } from "@/features/errors/error-provider"
export {
  DEFAULT_ERROR_CHANNELS,
  useError,
  type ErrorChannel,
  type HandleOverrides,
  type RunOptions,
} from "@/features/errors/use-error"

// Intentionally omit server.ts — client barrels must not pull server code.
