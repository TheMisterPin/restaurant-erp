"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * Fixed generic fallback — one UI for every crash in the content slot.
 * No render-prop customization.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <CircleAlert
            className="size-10 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. You can reload this page or use the
              sidebar to navigate elsewhere.
            </p>
          </div>
          <Button type="button" onClick={this.handleReload}>
            Reload
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
