/**
 * Isomorphic error contract — safe to import from both server and client.
 * No React or Node imports.
 */

export type ErrorKind =
  | "validation"
  | "auth"
  | "permission"
  | "not_found"
  | "conflict"
  | "network"
  | "internal"

export type ErrorDTO = {
  kind: ErrorKind
  /** Machine-readable SCREAMING_SNAKE code, e.g. SESSION_EXPIRED */
  code: string
  /** Always safe for end users — never a raw exception message or stack */
  message: string
  /** Zod flatten().fieldErrors shape, keyed by FieldDef names */
  fieldErrors?: Record<string, string[]>
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorDTO }
