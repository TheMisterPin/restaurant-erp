import { AppError } from "@/features/errors/server"
import {
  type AppAction,
  type Permission,
  hasPermission,
  permissionsForRole,
} from "@/features/auth/permissions"
import { getSession, type SessionPayload } from "@/features/auth/utils"

export type AppSession = SessionPayload

export { hasPermission, permissionsForRole }

export async function requireSession(): Promise<AppSession> {
  const session = await getSession()
  if (!session) {
    throw new AppError({
      kind: "auth",
      code: "SESSION_EXPIRED",
      message: "Your session has expired. Please sign in again.",
    })
  }
  return session
}

/** Universal RBAC gate — session role must hold `action.permission`. */
export async function authorize(action: AppAction): Promise<AppSession> {
  const session = await requireSession()
  if (!hasPermission(session.role, action.permission)) {
    throw new AppError({
      kind: "permission",
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    })
  }
  return session
}

/** @deprecated Prefer `authorize(Actions.*)`. */
export async function requirePermission(
  permission: Permission,
): Promise<AppSession> {
  return authorize({ id: permission, permission })
}
