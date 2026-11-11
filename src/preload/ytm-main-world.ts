import type { InnertubeEndpoint, PlayerApiState, YtmCommand } from "@ipc/youtube/bridge"

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
    getVideoData: () => { video_id?: string; title?: string; author?: string; list?: string }
    getPlaylistId?: () => string | null
  }

  type Bridge = {
    getState: () => PlayerApiState | null
    command: (command: YtmCommand) => void
    request: (endpoint: InnertubeEndpoint, body: Record<string, unknown>) => Promise<unknown>
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
      playlistId: data.list || player.getPlaylistId?.() || null,
      title: data.title ?? "",
      artist: data.author ?? "",
      duration: player.getDuration() || 0,
      position: player.getCurrentTime() || 0,
      volume: player.getVolume()
    }
  }

  // Playing a specific track goes through the app's own navigation handler, which is what a
  // click in the UI uses, so the queue is built by YouTube Music. `ytmusic-app.navigate` and
  // `movie_player.loadVideoById` don't do this: the first is a silent no-op here and the second
  // bypasses the queue.
  //
  // Only endpoints built here are ever passed on, so the renderer can't hand the page an
  // arbitrary navigation object.
  const navigate = (endpoint: Record<string, unknown>): void => {
    const app = document.querySelector("ytmusic-app") as
      (HTMLElement & { handleNavigationEndpoint?: (endpoint: unknown) => void }) | null
    if (typeof app?.handleNavigationEndpoint !== "function") {
      console.warn("ytmusic-app.handleNavigationEndpoint is unavailable; cannot navigate")
      return
    }

    app.handleNavigationEndpoint(endpoint)
  }

  const playVideo = (
    videoId: string,
    musicVideoType?: string,
    playlistId?: string,
    index?: number
  ): void =>
    navigate({
      watchEndpoint: {
        videoId,
        // Inside a playlist, `index` is what makes next continue from this track.
        ...(playlistId && { playlistId }),
        ...(playlistId && Number.isInteger(index) && { index }),
        ...(musicVideoType && {
          watchEndpointMusicSupportedConfigs: { watchEndpointMusicConfig: { musicVideoType } }
        })
      }
    })

  const playPlaylist = (playlistId: string, params?: string): void =>
    navigate({ watchPlaylistEndpoint: { playlistId, ...(params && { params }) } })

  const command = (cmd: YtmCommand): void => {
    if (cmd.type === "playVideo") {
      playVideo(cmd.videoId, cmd.musicVideoType, cmd.playlistId, cmd.index)
      return
    }
    if (cmd.type === "playPlaylist") {
      playPlaylist(cmd.playlistId, cmd.params)
      return
    }

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

  const sha1Hex = async (text: string): Promise<string> => {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text))
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  // YouTube only treats a request as coming from the signed-in user when it carries this header,
  // even though the cookies are sent anyway. Without it a playlist comes back as its logged-out
  // version: mostly music videos instead of the audio tracks the YouTube Music page itself shows.
  // It is the same value the page computes for its own requests. Null when signed out.
  const authorizationHeader = async (origin: string): Promise<string | null> => {
    const sapisid = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("SAPISID="))
      ?.slice("SAPISID=".length)
    if (!sapisid) return null

    const timestamp = Math.floor(Date.now() / 1000)
    return `SAPISIDHASH ${timestamp}_${await sha1Hex(`${timestamp} ${sapisid} ${origin}`)}`
  }

  // Calls YouTube Music's own Innertube API from inside the page, so the user's cookies are sent
  // and the client context comes from the page's `ytcfg` instead of being hardcoded.
  const request = async (
    endpoint: InnertubeEndpoint,
    body: Record<string, unknown>
  ): Promise<unknown> => {
    if (!["search", "browse", "next"].includes(endpoint)) {
      throw new Error(`Unsupported Innertube endpoint: ${endpoint}`)
    }

    const ytcfg = (window as unknown as { ytcfg?: { get: (key: string) => unknown } }).ytcfg
    const context = ytcfg?.get("INNERTUBE_CONTEXT")
    const apiKey = ytcfg?.get("INNERTUBE_API_KEY")
    if (!context || !apiKey) throw new Error("YouTube Music config (ytcfg) is not ready yet")

    const authorization = await authorizationHeader(location.origin)
    const response = await fetch(`/youtubei/v1/${endpoint}?prettyPrint=false&key=${apiKey}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // The same headers the page sends itself.
        "X-Origin": location.origin,
        "X-Youtube-Client-Name": String(ytcfg?.get("INNERTUBE_CONTEXT_CLIENT_NAME")),
        "X-Youtube-Client-Version": String(ytcfg?.get("INNERTUBE_CONTEXT_CLIENT_VERSION")),
        ...(authorization && {
          Authorization: authorization,
          "X-Goog-AuthUser": "0",
          "X-Youtube-Bootstrap-Logged-In": "true"
        })
      },
      body: JSON.stringify({ context, ...body })
    })
    if (!response.ok) throw new Error(`Innertube ${endpoint} failed with status ${response.status}`)

    return response.json()
  }

  host.__yumuBridge = { getState, command, request }
}
