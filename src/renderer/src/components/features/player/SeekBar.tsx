import { usePlayerStore } from "@ipc/stores/player-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import { Slider } from "@renderer/components/ui/slider"
import { useEffect, useRef, useState } from "react"

const formatTime = (seconds: number) => {
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

function SeekBar() {
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)

  // While scrubbing, show the thumb where the user put it instead of the live position.
  const [scrub, setScrub] = useState<number | null>(null)
  const scrubRef = useRef<number | null>(null)
  const isScrubbing = scrub !== null

  const updateScrub = (seconds: number) => {
    scrubRef.current = seconds
    setScrub(seconds)
  }

  // The scrub ends from the window rather than the slider's own onPointerUp. Releasing outside
  // the slider, a cancelled pointer, or a keyboard change never reach the slider, which left
  // `scrub` set and the bar and timer frozen while the song kept playing.
  useEffect(() => {
    if (!isScrubbing) return

    const commit = () => {
      if (scrubRef.current !== null) {
        sendYtmCommand({ type: "seek", seconds: scrubRef.current })
      }
      scrubRef.current = null
      setScrub(null)
    }

    const endEvents = ["pointerup", "pointercancel", "keyup"] as const
    endEvents.forEach((name) => window.addEventListener(name, commit))
    return () => endEvents.forEach((name) => window.removeEventListener(name, commit))
  }, [isScrubbing])

  return (
    <div className="peer-[player] flex items-center gap-2 text-sm tabular-nums">
      <Slider
        min={0}
        max={duration || 1}
        step={1}
        defaultValue={0}
        value={scrub !== null ? [scrub] : [position]}
        onValueChange={(value) => updateScrub(value as number)}
        className="absolute inset-x-0 top-0"
      />
      <div className="inline-flex gap-1">
        <span className="">{formatTime(scrub ?? position)}</span>
        <span className="text-muted-foreground"> /</span>
        <span className="text-muted-foreground">{formatTime(duration)}</span>
      </div>
    </div>
  )
}

export default SeekBar
