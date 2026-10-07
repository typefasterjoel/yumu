// Channel names and shared types for the YouTube Music bridge.
//
// These live here rather than in `@ipc/types` on purpose: `preload/youtube.ts` imports them at
// runtime, and `@ipc/types` is also imported by the main preload (via api.ts). A module shared by
// both preload entries would be split into a chunk, which a sandboxed preload can't `require`.

export const YTM_COMMAND = "ytm:command"
export const YTM_PLAYER_STATE = "ytm:player-state"

export type PlaybackStatus = "idle" | "playing" | "paused" | "buffering"

export type YtmCommand =
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "next" }
  | { type: "previous" }
  /** Starts a specific track, the same way clicking it in the YouTube Music UI would. */
  | { type: "playVideo"; videoId: string; musicVideoType?: string }
  | { type: "seek"; seconds: number }
  | { type: "setVolume"; volume: number }

/** Innertube endpoints the bridge is allowed to call. */
export type InnertubeEndpoint = "search" | "browse" | "next"

/** What the main-world script can read straight from the YouTube Music player. */
export type PlayerApiState = {
  status: PlaybackStatus
  videoId: string | null
  title: string
  artist: string
  /** Seconds. */
  duration: number
  /** Seconds. */
  position: number
  /** 0-100. */
  volume: number
}

/** Player state plus the metadata that only exists in the page DOM. */
export type PlayerSnapshot = PlayerApiState & {
  album: string
  albumArt: string
}
