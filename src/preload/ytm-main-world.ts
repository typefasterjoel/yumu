import type { PlayerApiState, YtmCommand } from "@ipc/youtube/bridge"

/**
 * Runs in the page's main world, where `#movie_player` exposes its player API (the preload's
 * isolated world can't see those methods). The preload injects this with
 * `webFrame.executeJavaScript` because the page's Trusted Types policy blocks <script> tags.
 *
 * It is stringified with `.toString()`, so it must be fully self-contained: no imports, no
 * references to anything outside the function body.
 */
export function installYtmMainWorld(): void {
  type MoviePlayer = HTMLElement & {
    getPlayerState: () => number
    getCurrentTime: () => number
    getDuration: () => number
    getVolume: () => number
    setVolume: (volume: number) => void
    playVideo: () => void
    pauseVideo: () => void
    seekTo: (seconds: number, allowSeekAhead: boolean) => void
    getVideoData: () => { video_id?: string; title?: string; author?: string }
  }

  type Bridge = {
    getState: () => PlayerApiState | null
    command: (command: YtmCommand) => void
  }

  const host = window as unknown as { __yumuBridge?: Bridge }
  if (host.__yumuBridge) return

  const getPlayer = () => document.getElementById("movie_player") as MoviePlayer | null

  const getState = (): PlayerApiState | null => {
    const player = getPlayer()
    if (!player || typeof player.getPlayerState !== "function") return null

    const data = player.getVideoData()
    const playerState = player.getPlayerState()

    return {
      // 1 playing, 2 paused, 3 buffering; -1 unstarted, 0 ended, 5 cued all read as idle.
      status:
        playerState === 1
          ? "playing"
          : playerState === 2
            ? "paused"
            : playerState === 3
              ? "buffering"
              : "idle",
      videoId: data.video_id || null,
      title: data.title ?? "",
      artist: data.author ?? "",
      duration: player.getDuration() || 0,
      position: player.getCurrentTime() || 0,
      volume: player.getVolume()
    }
  }

  const command = (cmd: YtmCommand): void => {
    const player = getPlayer()
    if (!player) return

    switch (cmd.type) {
      case "play":
        player.playVideo()
        break
      case "pause":
        player.pauseVideo()
        break
      case "toggle":
        if (player.getPlayerState() === 1) player.pauseVideo()
        else player.playVideo()
        break
      case "seek":
        if (Number.isFinite(cmd.seconds)) player.seekTo(Math.max(0, cmd.seconds), true)
        break
      case "setVolume":
        if (Number.isFinite(cmd.volume)) player.setVolume(Math.min(100, Math.max(0, cmd.volume)))
        break
    }
  }

  host.__yumuBridge = { getState, command }
}
