"use client"

import { OpsShell } from "@/features/restaurant/components/ops-shell"
import { BarPage } from "@/features/restaurant/components/pages/bar-page"
import { useBarPage } from "@/features/restaurant/hooks/use-bar-page"

export default function BarRoutePage() {
  const page = useBarPage()
  return (
    <OpsShell station="bar">
      <BarPage {...page} />
    </OpsShell>
  )
}
