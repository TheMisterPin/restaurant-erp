"use server"

import { prisma } from "@/lib/db"
import type { ActionResult } from "@/features/errors/dto"
import { AppError, withErrorBoundary } from "@/features/errors/server"
import { authenticateUser } from "@/features/auth/password"
import {
  createSession,
  clearSession,
  getSession,
} from "@/features/auth/utils"
import { toMe, type Me } from "@/features/auth/types"
import { logActivity } from "@/features/logging/server"

export async function loginAction(
  input: unknown,
): Promise<ActionResult<Me>> {
  return withErrorBoundary(async () => {
    const body =
      typeof input === "object" && input !== null
        ? (input as { email?: unknown; password?: unknown })
        : {}
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      throw new AppError({
        kind: "validation",
        code: "INVALID_INPUT",
        message: "Email and password are required.",
      })
    }

    const user = await authenticateUser(email, password)
    await createSession(user)

    await logActivity({
      userId: user.id,
      activity: "LOGIN",
    })

    return toMe(user)
  })
}

export async function logoutAction(): Promise<ActionResult<true>> {
  return withErrorBoundary(async () => {
    const session = await getSession()
    if (session) {
      await logActivity({
        userId: session.userId,
        activity: "LOGOUT",
      })
    }
    await clearSession()
    return true as const
  })
}

export async function getMeAction(): Promise<ActionResult<Me | null>> {
  return withErrorBoundary(async () => {
    const session = await getSession()
    if (!session) return null

    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        deletedAt: null,
        isActive: true,
      },
    })

    if (!user) {
      await clearSession()
      return null
    }

    return toMe(user)
  })
}
