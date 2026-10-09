import { usePlayerStore } from "@ipc/stores/player-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import { Button } from "@renderer/components/ui/button"
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react"

function PlaybackControls() {
  const status = usePlayerStore((s) => s.status)

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => sendYtmCommand({ type: "previous" })}>
        <SkipBackIcon />
      </Button>
      <Button size="icon" onClick={() => sendYtmCommand({ type: "toggle" })}>
        {status === "playing" ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => sendYtmCommand({ type: "next" })}>
        <SkipForwardIcon />
      </Button>
    </div>
  )
}

export default PlaybackControls
