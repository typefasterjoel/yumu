import { usePlayerStore } from "@ipc/stores/player-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import SearchPanel from "@renderer/components/SearchPanel"
import { Button } from "@renderer/components/ui/button"
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react"
import { useState } from "react"

const formatTime = (seconds: number) => {
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

// Bridge test controls; the real UI replaces this.
function Yumu() {
  const status = usePlayerStore((s) => s.status)
  const track = usePlayerStore((s) => s.track)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)

  // While dragging, show the thumb where the user put it instead of the live position.
  const [scrub, setScrub] = useState<number | null>(null)

  return (
    <div className="bg-secondary fixed inset-0 z-10 flex flex-col gap-4 p-4 pt-14">
      <p className="text-muted-foreground text-sm">{status}</p>
      {track && (
        <div className="flex items-center gap-3">
          {track.albumArt && (
            <img src={track.albumArt} alt="" className="size-16 rounded-md object-cover" />
          )}
          <div>
            <p className="font-medium">{track.title}</p>
            <p className="text-muted-foreground text-sm">
              {track.artist}
              {track.album && ` • ${track.album}`}
            </p>
          </div>
        </div>
      )}

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

      <div className="flex items-center gap-2 text-sm tabular-nums">
        <span>{formatTime(scrub ?? position)}</span>
        <input
          type="range"
          className="flex-1"
          min={0}
          max={duration || 1}
          step={1}
          value={scrub ?? position}
          onChange={(e) => setScrub(Number(e.target.value))}
          onPointerUp={() => {
            if (scrub !== null) sendYtmCommand({ type: "seek", seconds: scrub })
            setScrub(null)
          }}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <label className="flex items-center gap-2 text-sm">
        Volume
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => sendYtmCommand({ type: "setVolume", volume: Number(e.target.value) })}
        />
      </label>

      <SearchPanel />
    </div>
  )
}
export default Yumu
