"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnConfig } from "@/components/shared/table/dynamic-table"
import type { User } from "@/features/users/types/user-types"

/** Column config for User rows in DynamicTable. */
export const userTableColumns: ColumnConfig[] = [
  {
    key: "fullName",
    label: "Name",
    type: "string",
    sortable: true,
  },
  {
    key: "email",
    label: "Email",
    type: "string",
    sortable: true,
  },
  {
    key: "role",
    label: "Role",
    type: "string",
    sortable: true,
    format: (value) => (
      <Badge variant="secondary">{String(value ?? "")}</Badge>
    ),
  },
  {
    key: "departmentName",
    label: "Department",
    type: "string",
    sortable: true,
  },
  {
    key: "locationName",
    label: "Location",
    type: "string",
    sortable: true,
  },
  {
    key: "isActive",
    label: "Status",
    type: "boolean",
    sortable: true,
    format: (value) => (
      <Badge variant={value ? "default" : "outline"}>
        {value ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    key: "isVerified",
    label: "Verified",
    type: "boolean",
    sortable: true,
  },
  {
    key: "createdAt",
    label: "Created",
    type: "date",
    sortable: true,
  },
]

/** Flatten User into a plain row DynamicTable can index. */
export function toUserTableRow(user: User): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    pictureUrl: user.pictureUrl ?? null,
    departmentId: user.departmentId ?? null,
    departmentName: user.departmentName ?? null,
    locationId: user.locationId ?? null,
    locationName: user.locationName ?? null,
    isActive: user.isActive,
    isVerified: user.isVerified,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  }
}
