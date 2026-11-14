// Kept out of `@ipc/types` on purpose: both preloads would share it, and a shared chunk can't be
// `require`d by a sandboxed preload.

export const YTM_COMMAND = "ytm:command"
export const YTM_PLAYER_STATE = "ytm:player-state"
export const YTM_QUEUE = "ytm:queue"
export const YTM_HEALTH = "ytm:health"

import type { TrackArtist } from "@ipc/youtube/parse-browse"

export type HealthCheckId =
  "bridge" | "player" | "navigation" | "config" | "queue" | "playerControls"

export type HealthCheck = {
  id: HealthCheckId
  ok: boolean
  critical: boolean
}

export type HealthReport = HealthCheck[]

export type PlaybackStatus = "idle" | "playing" | "paused" | "buffering"

export type YtmCommand =
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "shuffle" }
  | { type: "repeat" }
  | { type: "like" }
  // Without `index`, next restarts the queue from its first track.
  | {
      type: "playVideo"
      videoId: string
      musicVideoType?: string
      playlistId?: string
      index?: number
    }
  | { type: "playPlaylist"; playlistId: string; params?: string }
  | { type: "playQueueItem"; list: QueueList; index: number }
  | { type: "seek"; seconds: number }
  | { type: "setVolume"; volume: number }

export type QueueList = "items" | "autoplay"

export type QueueItem = {
  videoId: string
  // The audio or video version of the same song; the player can be on either.
  alternateVideoId: string | null
  title: string
  artists: TrackArtist[]
  album: string
  albumId: string | null
  thumbnail: string
  duration: string
}

export type QueueSnapshot = {
  source: string
  items: QueueItem[]
  autoplay: QueueItem[]
  current: { list: QueueList; index: number } | null
  shuffle: boolean
  repeat: "none" | "all" | "one"
}

export type InnertubeEndpoint = "search" | "browse"

export type PlayerApiState = {
  status: PlaybackStatus
  videoId: string | null
  playlistId: string | null
  title: string
  artist: string
  duration: number
  position: number
  volume: number
}

export type PlayerSnapshot = PlayerApiState & {
  artists: TrackArtist[]
  album: string
  albumId: string | null
  albumArt: string
  liked: boolean
}
