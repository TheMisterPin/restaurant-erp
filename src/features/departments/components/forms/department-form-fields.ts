import type { FieldDef } from "@/components/shared/forms/types"
import type { DepartmentFormValues } from "@/features/departments/types/department-types"
import {
  departmentDescriptionSchema,
  departmentIsActiveSchema,
  departmentNameSchema,
} from "@/lib/schemas/department"

export const departmentFormFields: FieldDef<DepartmentFormValues>[] = [
  {
    name: "name",
    type: "text",
    label: "Name",
    placeholder: "Engineering",
    validation: departmentNameSchema,
  },
  {
    name: "description",
    type: "textarea",
    label: "Description",
    placeholder: "Optional description",
    validation: departmentDescriptionSchema,
  },
  {
    name: "isActive",
    type: "switch",
    label: "Active",
    validation: departmentIsActiveSchema,
    defaultValue: true,
  },
]
