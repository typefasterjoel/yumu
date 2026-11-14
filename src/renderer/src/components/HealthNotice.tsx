import { useHealthStore } from "@ipc/stores/health-store"
import type { HealthCheckId } from "@ipc/youtube/bridge"
import { Button } from "@renderer/components/ui/button"
import { TriangleAlertIcon, XIcon } from "lucide-react"
import { useState } from "react"

const AFFECTED: Record<HealthCheckId, string> = {
  bridge: "everything",
  player: "playback, seeking and volume",
  navigation: "starting songs and playlists",
  config: "browsing, search and Home",
  queue: "the queue panel",
  playerControls: "media keys and next/previous"
}

function HealthNotice() {
  const report = useHealthStore((s) => s.report)
  const [dismissedKey, setDismissedKey] = useState("")

  const failing = report?.filter((check) => !check.ok) ?? []
  const key = failing.map((check) => check.id).join(",")
  if (!failing.length || key === dismissedKey) return null

  const critical = failing.some((check) => check.critical)

  return (
    <div
      role="alert"
      className="bg-card border-border absolute top-3 right-3 z-20 flex max-w-sm items-start gap-3 rounded-lg border p-3 shadow-lg"
    >
      <TriangleAlertIcon
        className={critical ? "text-destructive mt-0.5 size-4 shrink-0" : "mt-0.5 size-4 shrink-0"}
      />
      <div className="min-w-0 flex-1 text-sm">
        <p className="m-0 font-medium">
          {critical ? "YouTube Music has changed" : "Part of YouTube Music has changed"}
        </p>
        <p className="text-muted-foreground m-0 text-xs">
          Yumu can&apos;t reach: {failing.map((check) => AFFECTED[check.id]).join("; ")}. An update
          may be needed.
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss"
        onClick={() => setDismissedKey(key)}
      >
        <XIcon />
      </Button>
    </div>
  )
}

export default HealthNotice
