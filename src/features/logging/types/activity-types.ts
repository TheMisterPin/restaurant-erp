import type { Activity } from "@/generated/prisma/client"

/** Public activity row for list UI (joined user fields). */
export type UserActivityItem = {
  id: string
  userId: string
  userFullName: string
  userEmail: string
  activity: Activity
  activityData: unknown | null
  timestamp: Date
}

export type { Activity }
