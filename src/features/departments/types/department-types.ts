/** Public department shape returned by server actions. */
export type Department = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

/** Form values for create / update. */
export type DepartmentFormValues = {
  name: string
  description?: string
  isActive?: boolean
}
