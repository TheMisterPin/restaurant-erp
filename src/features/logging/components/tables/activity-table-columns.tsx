"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnConfig } from "@/components/shared/table/dynamic-table"
import type { UserActivityItem } from "@/features/logging/types/activity-types"

/** Column config for UserActivity rows in DynamicTable. */
export const activityTableColumns: ColumnConfig[] = [
  {
    key: "timestamp",
    label: "When",
    type: "date",
    sortable: true,
  },
  {
    key: "userFullName",
    label: "User",
    type: "string",
    sortable: true,
  },
  {
    key: "userEmail",
    label: "Email",
    type: "string",
    sortable: true,
  },
  {
    key: "activity",
    label: "Activity",
    type: "string",
    sortable: true,
    format: (value) => (
      <Badge variant="secondary">{String(value ?? "")}</Badge>
    ),
  },
  {
    key: "activityDataSummary",
    label: "Details",
    type: "string",
    sortable: false,
  },
]

function summarizeActivityData(data: unknown | null): string {
  if (data == null) return ""
  if (typeof data === "string") return data
  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

/** Flatten UserActivityItem into a plain row DynamicTable can index. */
export function toActivityTableRow(
  item: UserActivityItem,
): Record<string, unknown> {
  return {
    id: item.id,
    userId: item.userId,
    userFullName: item.userFullName,
    userEmail: item.userEmail,
    activity: item.activity,
    activityDataSummary: summarizeActivityData(item.activityData),
    timestamp: item.timestamp,
  }
}
