import { usePlayerStore } from "@ipc/stores/player-store"
import { useQueueStore } from "@ipc/stores/queue-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import { Button } from "@renderer/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip"
import {
  HeartIcon,
  PauseIcon,
  PlayIcon,
  Repeat1Icon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon
} from "lucide-react"

function PlaybackControls() {
  const status = usePlayerStore((s) => s.status)
  const liked = usePlayerStore((s) => s.liked)
  const shuffle = useQueueStore((s) => s.queue?.shuffle ?? false)
  const repeat = useQueueStore((s) => s.queue?.repeat ?? "none")

  return (
    <div className="flex items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={liked}
              className={liked ? "text-primary" : "text-muted-foreground"}
              onClick={() => sendYtmCommand({ type: "like" })}
            >
              <HeartIcon className={liked ? "fill-current" : undefined} />
              <span className="sr-only">Like</span>
            </Button>
          }
        />
        <TooltipContent>{liked ? "Liked Song" : "Like this Song"}</TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={shuffle}
        className={shuffle ? "text-primary" : "text-muted-foreground"}
        onClick={() => sendYtmCommand({ type: "shuffle" })}
      >
        <ShuffleIcon />
        <span className="sr-only">Shuffle</span>
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => sendYtmCommand({ type: "previous" })}>
        <SkipBackIcon />
      </Button>
      <Button size="icon-lg" onClick={() => sendYtmCommand({ type: "toggle" })}>
        {status === "playing" ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => sendYtmCommand({ type: "next" })}>
        <SkipForwardIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={repeat !== "none"}
        className={repeat !== "none" ? "text-primary" : "text-muted-foreground"}
        onClick={() => sendYtmCommand({ type: "repeat" })}
      >
        {repeat === "one" ? <Repeat1Icon /> : <RepeatIcon />}
        <span className="sr-only">Repeat</span>
      </Button>
    </div>
  )
}

export default PlaybackControls
