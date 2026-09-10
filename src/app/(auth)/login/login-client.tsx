"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useError } from "@/features/errors"
import { loginAction } from "@/features/auth/actions/auth-actions"
import { useAuth } from "@/features/auth/hooks/use-auth"

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/"
  return raw
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { run } = useError()
  const { refreshMe } = useAuth()
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("password123")

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use your account credentials to access the app.
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const me = await run(loginAction({ email, password }))
          if (me) {
            await refreshMe()
            toast.success(`Welcome, ${me.fullName}`)
            router.push(safeNextPath(searchParams.get("next")))
            router.refresh()
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Sign in</Button>
      </form>
    </div>
  )
}
