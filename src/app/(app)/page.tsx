"use client"

import Link from "next/link"

import { Actions, can } from "@/features/auth/permissions"
import { useAuth } from "@/features/auth/hooks/use-auth"

const demos = [
  {
    href: "/floor",
    title: "Floor",
    description: "Table cards, course firing, pickup, delivery, and billing",
    action: Actions.floor.read,
  },
  {
    href: "/kitchen",
    title: "Kitchen",
    description: "Fired courses, item prep, and derived ready-for-pickup",
    action: Actions.kitchen.read,
  },
  {
    href: "/bar",
    title: "Bar",
    description: "Active drinks, held course wine, and ready-for-pickup",
    action: Actions.bar.read,
  },
  {
    href: "/clock",
    title: "Time clock",
    description:
      "Kiosk check-in/out — requires today’s shift; warns when early or late",
    action: null,
  },
  {
    href: "/team/members",
    title: "Members",
    description: "List-page CRUD — forms, modals, RBAC, and useError().run()",
    action: Actions.users.read,
  },
  {
    href: "/team/activity",
    title: "Activity",
    description: "Audit trail — logActivity helper + read-only ADMIN list",
    action: Actions.logging.read,
  },
  {
    href: "/team/shift-templates",
    title: "Shift templates",
    description:
      "Reusable templates + generate dated instances (Admin / location manager)",
    action: Actions.shifts.read,
  },
  {
    href: "/team/my-shifts",
    title: "My shifts",
    description: "Calendar schedule — own shifts or managed-location coverage",
    action: Actions.shifts.read,
  },
  {
    href: "/profile",
    title: "Profile",
    description:
      "Self-service hub — edit profile, upcoming shifts, request time off / sick",
    action: null,
  },
  {
    href: "/team/time-off",
    title: "Time off",
    description:
      "Leave requests inbox — admin / location manager approve cancels shifts",
    action: Actions.timeOff.read,
  },
  {
    href: "/organization/departments",
    title: "Departments",
    description: "Organization vertical with the same list CRUD pattern",
    action: Actions.departments.read,
  },
  {
    href: "/organization/locations",
    title: "Locations",
    description: "Org vertical with manager select + list CRUD",
    action: Actions.locations.read,
  },
] as const

export default function Home() {
  const { me } = useAuth()

  const visible = demos.filter((demo) => {
    if (!demo.action) return true
    if (!me) return false
    return can(me.role, demo.action)
  })

  return (
    <div className="h-full min-h-0 overflow-y-auto p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-semibold leading-9 tracking-tight">
            Restaurant ERP
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Staff, rooms, scheduling, and service-station demos. Floor, Kitchen,
            and Bar share one table order lifecycle.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {visible.map((demo) => (
            <li key={demo.href}>
              <Link
                href={demo.href}
                className="hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
              >
                <span className="font-medium">{demo.title}</span>
                <p className="text-muted-foreground mt-1 text-sm">
                  {demo.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
