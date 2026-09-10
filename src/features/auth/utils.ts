import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { getJwtSecret, getSessionMaxAgeSeconds } from "@/lib/env"
import type { Role } from "@/generated/prisma/client"

export const SESSION_COOKIE = "session"

export type SessionPayload = {
  userId: string
  email: string
  role: Role
  fullName: string
  expires: string
}

type SessionJWTPayload = JWTPayload & {
  userId: string
  email: string
  role: Role
  fullName: string
  expires: string
}

function getKey() {
  return new TextEncoder().encode(getJwtSecret())
}

function getExpiryDate(): Date {
  return new Date(Date.now() + getSessionMaxAgeSeconds() * 1000)
}

export async function encrypt(
  payload: Omit<SessionPayload, "expires"> & { expires?: Date },
): Promise<string> {
  const expires = payload.expires ?? getExpiryDate()
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    fullName: payload.fullName,
    expires: expires.toISOString(),
  } satisfies Omit<SessionJWTPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(getKey())
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, getKey(), {
      algorithms: ["HS256"],
    })
    const data = payload as SessionJWTPayload
    if (
      typeof data.userId !== "string" ||
      typeof data.email !== "string" ||
      typeof data.role !== "string" ||
      typeof data.fullName !== "string" ||
      typeof data.expires !== "string"
    ) {
      return null
    }
    return {
      userId: data.userId,
      email: data.email,
      role: data.role,
      fullName: data.fullName,
      expires: data.expires,
    }
  } catch {
    return null
  }
}

export async function createSession(user: {
  id: string
  email: string
  role: Role
  fullName: string
}): Promise<void> {
  const expires = getExpiryDate()
  const session = await encrypt({
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    expires,
  })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, session, {
    expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)?.value
  if (!session) return null
  return await decrypt(session)
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value
  if (!session) return NextResponse.next()

  const parsed = await decrypt(session)
  if (!parsed) return NextResponse.next()

  const expires = getExpiryDate()
  const res = NextResponse.next()
  res.cookies.set({
    name: SESSION_COOKIE,
    value: await encrypt({
      userId: parsed.userId,
      email: parsed.email,
      role: parsed.role,
      fullName: parsed.fullName,
      expires,
    }),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  })
  return res
}
