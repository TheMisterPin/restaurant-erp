"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type ErrorContextValue = {
  reportFatal: (error: Error) => void
}

const ErrorContext = createContext<ErrorContextValue | null>(null)

/**
 * Holds fatal errors from event handlers / rejected promises and rethrows
 * them during render so the nearest ErrorBoundary can catch them.
 */
export function ErrorProvider({ children }: { children: ReactNode }) {
  const [fatalError, setFatalError] = useState<Error | null>(null)

  const reportFatal = useCallback((error: Error) => {
    setFatalError(error)
  }, [])

  const value = useMemo(() => ({ reportFatal }), [reportFatal])

  if (fatalError) {
    throw fatalError
  }

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  )
}

export function useErrorContext(): ErrorContextValue {
  const ctx = useContext(ErrorContext)
  if (!ctx) {
    throw new Error("useErrorContext must be used within an ErrorProvider")
  }
  return ctx
}
