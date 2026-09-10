import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { AppError } from "@/features/errors/server"
import type { Role } from "@/generated/prisma/client"

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export type AuthUser = {
  id: string
  email: string
  role: Role
  fullName: string
  firstName: string
  lastName: string
  pictureUrl: string | null
  isActive: boolean
  isVerified: boolean
  departmentId: string | null
  locationId: string | null
  password: string
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  const user = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  })

  if (!user || !user.isActive) {
    throw new AppError({
      kind: "auth",
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    })
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    throw new AppError({
      kind: "auth",
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    })
  }

  return user
}
