"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"

import type {
  ModalConfig,
  ModalContextValue,
  StackEntry,
} from "@/components/shared/modals/types"

type ModalState = {
  stack: StackEntry[]
}

type ModalAction =
  | { type: "PUSH"; entry: StackEntry }
  | { type: "REMOVE"; id: string }
  | { type: "POP" }
  | { type: "SET_DIRTY"; id: string; isDirty: boolean }
  | { type: "CLEAR" }

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "PUSH":
      return { stack: [...state.stack, action.entry] }
    case "REMOVE":
      return { stack: state.stack.filter((entry) => entry.id !== action.id) }
    case "POP":
      if (state.stack.length === 0) return state
      return { stack: state.stack.slice(0, -1) }
    case "SET_DIRTY":
      return {
        stack: state.stack.map((entry) => {
          if (entry.id !== action.id || entry.type !== "form") return entry
          return { ...entry, isDirty: action.isDirty }
        }),
      }
    case "CLEAR":
      return { stack: [] }
    default:
      return state
  }
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(modalReducer, { stack: [] })

  const openModal = useCallback((config: ModalConfig): string => {
    const id = crypto.randomUUID()
    const entry: StackEntry =
      config.type === "form"
        ? { ...config, id, isDirty: false }
        : { ...config, id }
    dispatch({ type: "PUSH", entry })
    return id
  }, [])

  const closeModal = useCallback((id?: string) => {
    if (id === undefined) {
      dispatch({ type: "POP" })
      return
    }
    dispatch({ type: "REMOVE", id })
  }, [])

  const setDirty = useCallback((id: string, isDirty: boolean) => {
    dispatch({ type: "SET_DIRTY", id, isDirty })
  }, [])

  const closeAll = useCallback(() => {
    dispatch({ type: "CLEAR" })
  }, [])

  const value = useMemo<ModalContextValue>(
    () => ({
      stack: state.stack,
      openModal,
      closeModal,
      setDirty,
      closeAll,
    }),
    [state.stack, openModal, closeModal, setDirty, closeAll],
  )

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModalContext(): ModalContextValue {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModalContext must be used within a ModalProvider")
  }
  return context
}
