import { create } from "zustand"
import type { PlaybackStatus, PlayerSnapshot } from "@ipc/youtube/bridge"

export type Track = Pick<PlayerSnapshot, "videoId" | "title" | "artist" | "album" | "albumArt">

type PlayerState = {
  status: PlaybackStatus
  track: Track | null
  /** Seconds. */
  duration: number
  /** Seconds, as of `positionUpdatedAt`. Interpolate in the UI while playing. */
  position: number
  /** `Date.now()` when `position` was last reported. */
  positionUpdatedAt: number
  /** 0-100. */
  volume: number
}

type PlayerActions = {
  applySnapshot: (snapshot: PlayerSnapshot) => void
  reset: () => void
}

const initialState: PlayerState = {
  status: "idle",
  track: null,
  duration: 0,
  position: 0,
  positionUpdatedAt: 0,
  volume: 100
}

/**
 * Mirror of the YouTube Music player. The webview owns the real state; this is only
 * written from `receiveYouTubeEvents`, never from UI components. To change playback, send a
 * command with `sendYtmCommand`.
 */
export const usePlayerStore = create<PlayerState & PlayerActions>()((set) => ({
  ...initialState,

  applySnapshot: ({
    status,
    videoId,
    title,
    artist,
    album,
    albumArt,
    duration,
    position,
    volume
  }) =>
    set({
      status,
      track: title ? { videoId, title, artist, album, albumArt } : null,
      duration,
      position,
      positionUpdatedAt: Date.now(),
      volume
    }),

  reset: () => set(initialState)
}))
