import { create } from "zustand"
import type { PlaybackStatus, PlayerSnapshot } from "@ipc/youtube/bridge"

export type Track = Pick<PlayerSnapshot, "videoId" | "title" | "artist" | "album" | "albumArt">

// After a seek, snapshots reporting a position further than this from the target are stale.
const SEEK_SETTLE_TOLERANCE_SECONDS = 2
// Stop waiting for a seek to land after this long, so a failed seek can't pin the position.
const SEEK_SETTLE_TIMEOUT_MS = 3000

type PendingSeek = { seconds: number; expiresAt: number }

type PlayerState = {
  status: PlaybackStatus
  track: Track | null
  /** The album or playlist the queue came from, if any. */
  playlistId: string | null
  /** Seconds. */
  duration: number
  /** Seconds, as of `positionUpdatedAt`. Interpolate in the UI while playing. */
  position: number
  /** `Date.now()` when `position` was last reported. */
  positionUpdatedAt: number
  /** 0-100. */
  volume: number
  /** A seek that was sent but hasn't shown up in a snapshot yet. */
  pendingSeek: PendingSeek | null
}

type PlayerActions = {
  applySnapshot: (snapshot: PlayerSnapshot) => void
  /** Shows a seek immediately instead of waiting for the webview to confirm it. */
  applyOptimisticSeek: (seconds: number) => void
  reset: () => void
}

const initialState: PlayerState = {
  status: "idle",
  track: null,
  playlistId: null,
  duration: 0,
  position: 0,
  positionUpdatedAt: 0,
  volume: 100,
  pendingSeek: null
}

/**
 * Mirror of the YouTube Music player. The webview owns the real state; this is written from
 * `receiveYouTubeEvents`, and `sendYtmCommand` applies seeks optimistically. UI components
 * don't write to it; to change playback, send a command with `sendYtmCommand`.
 */
export const usePlayerStore = create<PlayerState & PlayerActions>()((set) => ({
  ...initialState,

  applySnapshot: ({
    status,
    videoId,
    playlistId,
    title,
    artist,
    album,
    albumArt,
    duration,
    position,
    volume
  }) =>
    set((state) => {
      const now = Date.now()
      const { pendingSeek } = state

      // Until the seek shows up in a snapshot, ones with the old position would snap the bar back.
      const seekPending =
        pendingSeek !== null &&
        now < pendingSeek.expiresAt &&
        state.track?.videoId === videoId &&
        Math.abs(position - pendingSeek.seconds) > SEEK_SETTLE_TOLERANCE_SECONDS

      return {
        status,
        track: title
          ? {
              videoId,
              title,
              artist,
              album,
              // The art is scraped from the DOM and can read empty for a moment (the player bar
              // re-rendering, say); keep the last good one for the same song instead of blanking.
              albumArt: albumArt || (state.track?.videoId === videoId ? state.track.albumArt : "")
            }
          : null,
        playlistId,
        duration,
        volume,
        ...(seekPending ? {} : { position, positionUpdatedAt: now, pendingSeek: null })
      }
    }),

  applyOptimisticSeek: (seconds) => {
    const now = Date.now()
    set({
      position: seconds,
      positionUpdatedAt: now,
      pendingSeek: { seconds, expiresAt: now + SEEK_SETTLE_TIMEOUT_MS }
    })
  },

  reset: () => set(initialState)
}))
