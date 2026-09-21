"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Actions,
  can,
  postLoginPath,
  ROLE_LABELS,
} from "@/features/auth/permissions"
import { useAuth } from "@/features/auth/hooks/use-auth"

type Station = "floor" | "kitchen" | "bar"

const STATIONS: Array<{
  id: Station
  href: `/${Station}`
  label: string
  action: (typeof Actions)["floor" | "kitchen" | "bar"]["read"]
}> = [
  { id: "floor", href: "/floor", label: "Floor", action: Actions.floor.read },
  {
    id: "kitchen",
    href: "/kitchen",
    label: "Kitchen",
    action: Actions.kitchen.read,
  },
  { id: "bar", href: "/bar", label: "Bar", action: Actions.bar.read },
]

function formatClock(now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now)
}

export function OpsShell({
  station,
  children,
}: {
  station: Station
  children: React.ReactNode
}) {
  const { me, status, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (status !== "authenticated" || !me) return
    const allowed = STATIONS.find((entry) => entry.id === station)
    if (!allowed || can(me.role, allowed.action)) return
    router.replace(postLoginPath(me.role))
  }, [me, station, status, router])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  const visibleStations = STATIONS.filter((entry) =>
    me ? can(me.role, entry.action) : false,
  )
  const canOpenHome = me?.role === "ADMIN" || me?.role === "USER"
  const title = STATIONS.find((entry) => entry.id === station)?.label ?? "Service"

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface-1 px-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {me ? ROLE_LABELS[me.role] : "Service"}
          </p>
          <h1 className="truncate text-base font-semibold leading-5">{title}</h1>
        </div>
        <p className="font-mono text-sm tabular-nums text-text-secondary">
          {formatClock(now)}
        </p>
        {visibleStations.length > 1 ? (
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Stations">
            {visibleStations.map((entry) => (
              <Button
                key={entry.id}
                asChild
                size="sm"
                variant={pathname === entry.href ? "secondary" : "ghost"}
              >
                <Link href={entry.href}>{entry.label}</Link>
              </Button>
            ))}
          </nav>
        ) : null}
        {canOpenHome ? (
          <Button asChild size="icon" variant="ghost" aria-label="ERP home">
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Sign out"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {status === "loading" ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
