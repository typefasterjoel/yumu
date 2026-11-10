import { usePlayerStore, type Track } from "@ipc/stores/player-store"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

/** Degrees per second at full speed; one turn every 4.5s. */
const SPIN_SPEED = 360 / 4
/** Seconds for the spin to cover about 63% of the way to its target speed. Bigger is lazier. */
const SPIN_EASE_TIME_CONSTANT = 0.5
/** How far the disc slides down to be out of view, as a share of its own height. */
const DISC_OFFSCREEN = "250%"

/**
 * Spins an element by driving its `rotate` from a frame loop, so the speed can ease in when
 * playback starts and coast to a stop when it pauses. A CSS animation can only pause instantly.
 */
function useEasedSpin(spinning: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const spinningRef = useRef(spinning)

  useEffect(() => {
    spinningRef.current = spinning
  }, [spinning])

  useEffect(() => {
    let angle = 0
    let velocity = 0
    let last = performance.now()
    let frame = requestAnimationFrame(tick)

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      const target = spinningRef.current ? SPIN_SPEED : 0
      // Exponential approach, independent of frame rate.
      velocity += (target - velocity) * (1 - Math.exp(-dt / SPIN_EASE_TIME_CONSTANT))
      if (target === 0 && velocity < 0.5) velocity = 0

      angle = (angle + velocity * dt) % 360
      if (ref.current) ref.current.style.rotate = `${angle}deg`

      frame = requestAnimationFrame(tick)
    }

    return () => cancelAnimationFrame(frame)
  }, [])

  return ref
}

/**
 * Album art goes through the main process because the renderer's own request for some images
 * gets a 429 from Google's image host. Falls back to the plain URL if that fails.
 */
function useAlbumArtSrc(url: string): string | null {
  const [loaded, setLoaded] = useState<{ url: string; src: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    window.yumu
      .getAlbumArt(url)
      .then((src) => {
        if (!cancelled) setLoaded({ url, src: src ?? url })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ url, src: url })
      })
    return () => {
      cancelled = true
    }
  }, [url])

  return loaded?.url === url ? loaded.src : null
}

function Disc({ track, spinning }: { track: Track; spinning: boolean }) {
  const spinRef = useEasedSpin(spinning)
  const src = useAlbumArtSrc(track.albumArt)

  return (
    <div ref={spinRef} className="size-full overflow-hidden rounded-full">
      <div className="bg-background border-primary/60 absolute top-1/2 left-1/2 z-90 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" />
      {src && <img src={src} alt={track.album} className="h-full w-full object-cover" />}
    </div>
  )
}

function NowPlaying() {
  const status = usePlayerStore((s) => s.status)
  const track = usePlayerStore((s) => s.track)

  // Keyed by song: when it changes, the old disc slides out, then the new one slides in. Between
  // songs the player reports idle, which also takes the disc out until the next one loads.
  const disc = track && track.albumArt && status !== "idle" ? track : null

  return (
    <div className="relative flex grow flex-col gap-2 ps-36">
      <AnimatePresence mode="wait">
        {disc && (
          <motion.div
            key={disc.videoId}
            initial={{ y: DISC_OFFSCREEN }}
            animate={{ y: 0, transition: { type: "spring", stiffness: 55, damping: 12 } }}
            exit={{ y: DISC_OFFSCREEN, transition: { duration: 0.7, ease: "easeIn" } }}
            className="bg-accent border-primary/60 absolute inset-s-0 top-1/2 z-90 size-32 -translate-y-1/2 rounded-full border-3 shadow-md transition-[top] peer-[player]:hover:top-full"
          >
            <Disc track={disc} spinning={status === "playing"} />
          </motion.div>
        )}
      </AnimatePresence>
      {track && (
        <div className="flex items-start gap-3">
          <div>
            <div className="flex grow flex-col gap-1">
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
