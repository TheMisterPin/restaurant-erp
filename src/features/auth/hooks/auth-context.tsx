"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  getMeAction,
  loginAction,
  logoutAction,
} from "@/features/auth/actions/auth-actions"
import type { Me } from "@/features/auth/types"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthContextValue = {
  me: Me | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<Me | null>
  logout: () => Promise<boolean>
  refreshMe: () => Promise<Me | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function resolveMe(): Promise<Me | null> {
  const result = await getMeAction()
  if (result.ok && result.data) return result.data
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  const refreshMe = useCallback(async () => {
    const next = await resolveMe()
    setMe(next)
    setStatus(next ? "authenticated" : "unauthenticated")
    return next
  }, [])

  useEffect(() => {
    let cancelled = false

    void resolveMe().then((next) => {
      if (cancelled) return
      setMe(next)
      setStatus(next ? "authenticated" : "unauthenticated")
    })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAction({ email, password })
    if (result.ok) {
      setMe(result.data)
      setStatus("authenticated")
      return result.data
    }
    setMe(null)
    setStatus("unauthenticated")
    return null
  }, [])

  const logout = useCallback(async () => {
    const result = await logoutAction()
    setMe(null)
    setStatus("unauthenticated")
    return result.ok
  }, [])

  return (
    <AuthContext.Provider value={{ me, status, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return ctx
}
