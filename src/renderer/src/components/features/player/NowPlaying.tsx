import { usePlayerStore } from "@ipc/stores/player-store"
import { cn } from "cn"

function NowPlaying() {
  const status = usePlayerStore((s) => s.status)
  const track = usePlayerStore((s) => s.track)

  return (
    <div className="relative flex flex-col gap-2 ps-36">
      {/*<p className="text-muted-foreground text-sm">{status}</p>*/}
      {track && (
        <div className="flex items-start gap-3">
          {track.albumArt && (
            <div
              className={cn(
                "bg-accent animation-duration-[5s] border-primary/60 fill-mode-forwards absolute inset-s-0 top-1/2 size-32 -translate-y-1/2 overflow-hidden rounded-full border-4 shadow-md transition",
                status === "playing" && "animate-spin",
                status === "paused" && "paused animate-spin"
              )}
            >
              <img src={track.albumArt} alt="" className="h-full w-full rounded-md object-cover" />
            </div>
          )}
          <div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{track.title}</p>
              <p className="text-muted-foreground text-xs">
                {track.artist}
                {track.album && ` • ${track.album}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NowPlaying
