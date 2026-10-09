import { usePlayerStore } from "@ipc/stores/player-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
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
    <div className="flex flex-1 items-center gap-2 text-sm tabular-nums">
      <span>{formatTime(scrub ?? position)}</span>
      <input
        type="range"
        className="flex-1"
        min={0}
        max={duration || 1}
        step={1}
        value={scrub ?? position}
        onChange={(e) => updateScrub(Number(e.target.value))}
      />
      <span>{formatTime(duration)}</span>
    </div>
  )
}

export default SeekBar
