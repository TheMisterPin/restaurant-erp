import { ErrorBoundary } from "@/features/errors"

export default function OpsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  )
}
