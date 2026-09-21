"use client"

import { OpsShell } from "@/features/restaurant/components/ops-shell"
import { KitchenPage } from "@/features/restaurant/components/pages/kitchen-page"
import { useKitchenPage } from "@/features/restaurant/hooks/use-kitchen-page"

export default function KitchenRoutePage() {
  const page = useKitchenPage()
  return (
    <OpsShell station="kitchen">
      <KitchenPage {...page} />
    </OpsShell>
  )
}
