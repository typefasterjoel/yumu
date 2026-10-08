import { usePlayerStore } from "@ipc/stores/player-store"

// How far the position may drift from where playback should be before it counts as a seek.
const SEEK_TOLERANCE_SECONDS = 2
// Album art trails the player API at a track change, so wait for it before announcing the track.
const TRACK_CHANGE_DELAY_MS = 1200
const STATUS_CHANGE_DELAY_MS = 300
// The player briefly reports idle between tracks; only clear the presence if it stays that way.
const IDLE_CLEAR_DELAY_MS = 3000
// A song left paused this long means nobody is listening; take the presence down.
const PAUSED_CLEAR_DELAY_MS = 10 * 60 * 1000

type Sent = {
  videoId: string | null
  title: string
  artist: string
  album: string
  albumArt: string
  status: "playing" | "paused"
  /** Seconds, as sent to Discord. */
  position: number
  /** `Date.now()` when `position` was sent. */
  at: number
}

/**
 * Mirrors the player store to Discord Rich Presence. Only meaningful changes are sent (a new
 * track, play/pause, a seek), not the once-a-second position ticks, which keeps well inside
 * Discord's activity rate limit. Returns a function that stops syncing.
 */
export function startDiscordSync(): () => void {
  let lastSent: Sent | null = null
  let sendTimer: ReturnType<typeof setTimeout> | undefined
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let pausedTimer: ReturnType<typeof setTimeout> | undefined
  // Set once a long pause cleared the presence, so later paused snapshots (a volume change, say)
  // don't bring it back. Playback resuming is what shows it again.
  let pauseExpired = false

  const send = () => {
    sendTimer = undefined

    const { status, track, position, positionUpdatedAt, duration } = usePlayerStore.getState()
    if (!track || (status !== "playing" && status !== "paused")) return

    const now = Date.now()
    // The snapshot is a little old by now; while playing, account for the time that has passed.
    const currentTime =
      status === "playing" ? position + (now - positionUpdatedAt) / 1000 : position

    const song = {
      title: track.title,
      artist: track.artist || "Unknown Artist",
      album: track.album || "Unknown Album",
      albumArt: track.albumArt,
      duration,
      currentTime
    }
    window.yumu.updateDiscord(song, status)

    lastSent = {
      videoId: track.videoId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArt: track.albumArt,
      status,
      position: currentTime,
      at: now
    }
  }

  const clearPresence = () => {
    clearTimeout(sendTimer)
    sendTimer = undefined
    lastSent = null
    window.yumu.clearDiscordActivity()
  }

  // Only schedules when nothing is pending. `send` reads the store when it fires, so a pending
  // update always carries the latest state, and the steady position ticks can't keep pushing a
  // pending update back.
  const schedule = (delayMs: number) => {
    sendTimer ??= setTimeout(send, delayMs)
  }

  const unsubscribe = usePlayerStore.subscribe((state) => {
    if (state.status === "buffering") return

    const { track, status } = state
    if (!track || (status !== "playing" && status !== "paused")) {
      if (lastSent && idleTimer === undefined) {
        idleTimer = setTimeout(() => {
          idleTimer = undefined
          clearPresence()
        }, IDLE_CLEAR_DELAY_MS)
      }
      clearTimeout(pausedTimer)
      pausedTimer = undefined
      pauseExpired = false
      return
    }

    clearTimeout(idleTimer)
    idleTimer = undefined

    if (status === "playing") {
      clearTimeout(pausedTimer)
      pausedTimer = undefined
      pauseExpired = false
    } else {
      if (pauseExpired) return
      pausedTimer ??= setTimeout(() => {
        pausedTimer = undefined
        pauseExpired = true
        clearPresence()
      }, PAUSED_CLEAR_DELAY_MS)
    }

    const trackChanged =
      !lastSent ||
      lastSent.videoId !== track.videoId ||
      lastSent.title !== track.title ||
      lastSent.artist !== track.artist ||
      lastSent.album !== track.album ||
      lastSent.albumArt !== track.albumArt
    if (trackChanged) return schedule(TRACK_CHANGE_DELAY_MS)

    if (lastSent!.status !== status) return schedule(STATUS_CHANGE_DELAY_MS)

    if (status === "playing") {
      const expected = lastSent!.position + (state.positionUpdatedAt - lastSent!.at) / 1000
      if (Math.abs(state.position - expected) > SEEK_TOLERANCE_SECONDS) {
        schedule(STATUS_CHANGE_DELAY_MS)
      }
    }
  })

  return () => {
    unsubscribe()
    clearTimeout(sendTimer)
    clearTimeout(idleTimer)
    clearTimeout(pausedTimer)
  }
}
