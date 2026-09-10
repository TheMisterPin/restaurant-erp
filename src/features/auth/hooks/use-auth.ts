"use client"

import { useAuthContext } from "@/features/auth/hooks/auth-context"

/**
 * Client auth hook — session state + login/logout/refresh.
 * Server actions live in `@/features/auth/actions/auth-actions`.
 */
export function useAuth() {
  return useAuthContext()
}
