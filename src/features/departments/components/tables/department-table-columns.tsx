"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnConfig } from "@/components/shared/table/dynamic-table"
import type { Department } from "@/features/departments/types/department-types"

/** Column config for Department rows in DynamicTable. */
export const departmentTableColumns: ColumnConfig[] = [
  {
    key: "name",
    label: "Name",
    type: "string",
    sortable: true,
  },
  {
    key: "description",
    label: "Description",
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
    key: "createdAt",
    label: "Created",
    type: "date",
    sortable: true,
  },
]

/** Flatten Department into a plain row DynamicTable can index. */
export function toDepartmentTableRow(
  department: Department,
): Record<string, unknown> {
  return {
    id: department.id,
    name: department.name,
    description: department.description ?? null,
    isActive: department.isActive,
    createdAt: department.createdAt ?? null,
    updatedAt: department.updatedAt ?? null,
  }
}
