"use client"

import { OpsShell } from "@/features/restaurant/components/ops-shell"
import { FloorPage } from "@/features/restaurant/components/pages/floor-page"
import { useFloorPage } from "@/features/restaurant/hooks/use-floor-page"

export default function FloorRoutePage() {
  const page = useFloorPage()
  return (
    <OpsShell station="floor">
      <FloorPage {...page} />
    </OpsShell>
  )
}
