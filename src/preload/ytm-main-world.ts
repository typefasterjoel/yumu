import type {
  InnertubeEndpoint,
  PlayerApiState,
  QueueItem,
  QueueSnapshot,
  YtmCommand
} from "@ipc/youtube/bridge"

/**
 * Injected into the page with `webFrame.executeJavaScript` (Trusted Types blocks <script>) and
 * stringified with `.toString()`, so it must be self-contained: no imports or outside references.
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
    getQueue: () => QueueSnapshot | null
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
      // 1 playing, 2 paused, 3 buffering; anything else is idle.
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

  type Loose = Record<string, unknown> | undefined
  type QueueStore = { items?: unknown[]; automixItems?: unknown[]; [key: string]: unknown }

  const asObject = (value: unknown): Loose =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : undefined
  const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
  const asString = (value: unknown): string => (typeof value === "string" ? value : "")

  const getQueueStore = (): QueueStore | null => {
    const element = document.querySelector("ytmusic-player-queue") as
      (HTMLElement & { getState?: () => { queue?: QueueStore } }) | null
    return element?.getState?.().queue ?? null
  }

  const rowRenderers = (entry: unknown) => {
    const row = asObject(entry)
    const wrapper = asObject(row?.playlistPanelVideoWrapperRenderer)
    const primary = asObject(
      asObject(wrapper?.primaryRenderer)?.playlistPanelVideoRenderer ??
        row?.playlistPanelVideoRenderer
    )
    const counterpart = asObject(
      asObject(asObject(asList(wrapper?.counterpart)[0])?.counterpartRenderer)
        ?.playlistPanelVideoRenderer
    )
    return { primary, counterpart }
  }

  const pageTypeOf = (run: unknown): string =>
    asString(
      asObject(
        asObject(
          asObject(asObject(asObject(run)?.navigationEndpoint)?.browseEndpoint)
            ?.browseEndpointContextSupportedConfigs
        )?.browseEndpointContextMusicConfig
      )?.pageType
    )

  const browseIdOf = (run: unknown): string =>
    asString(asObject(asObject(asObject(run)?.navigationEndpoint)?.browseEndpoint)?.browseId)

  const parseQueueItem = (entry: unknown): QueueItem | null => {
    const { primary, counterpart } = rowRenderers(entry)
    const videoId = asString(primary?.videoId)
    if (!primary || !videoId) return null

    const runs = asList(asObject(primary.longBylineText)?.runs)
    const artists = runs
      .filter((run) => pageTypeOf(run) === "MUSIC_PAGE_TYPE_ARTIST")
      .map((run) => ({
        name: asString(asObject(run)?.text),
        browseId: browseIdOf(run) || null
      }))
    const firstRun = asString(asObject(runs[0])?.text).trim()
    const albumRun = runs.find((run) => pageTypeOf(run) === "MUSIC_PAGE_TYPE_ALBUM")
    const thumbnails = asList(asObject(asObject(primary.thumbnail))?.thumbnails)

    return {
      videoId,
      alternateVideoId: asString(counterpart?.videoId) || null,
      title: asString(asObject(asList(asObject(primary.title)?.runs)[0])?.text),
      artists: artists.length ? artists : firstRun ? [{ name: firstRun, browseId: null }] : [],
      album: albumRun ? asString(asObject(albumRun)?.text) : "",
      albumId: albumRun ? browseIdOf(albumRun) || null : null,
      thumbnail: asString(asObject(thumbnails[thumbnails.length - 1])?.url),
      duration: asString(asObject(asList(asObject(primary.lengthText)?.runs)[0])?.text)
    }
  }

  const parseQueueList = (entries: unknown[]): QueueItem[] =>
    entries.flatMap((entry) => parseQueueItem(entry) ?? [])

  const getQueue = (): QueueSnapshot | null => {
    const queue = getQueueStore()
    if (!queue) return null

    const rawItems = asList(queue.items)
    const rawAutoplay = asList(queue.automixItems)
    const items = parseQueueList(rawItems)
    const autoplay = parseQueueList(rawAutoplay)

    // The page leaves stale `selected` flags, so they only break ties between matching rows.
    const playingId = getPlayer()?.getVideoData().video_id
    const isSelected = (entry: unknown) => {
      const { primary, counterpart } = rowRenderers(entry)
      return primary?.selected === true || counterpart?.selected === true
    }
    const find = (list: QueueItem[], raw: unknown[]): number => {
      const matches = list.flatMap((item, index) =>
        item.videoId === playingId || item.alternateVideoId === playingId ? [index] : []
      )
      return matches.filter((index) => isSelected(raw[index])).pop() ?? matches[0] ?? -1
    }
    const inItems = playingId ? find(items, rawItems) : -1
    const inAutoplay = playingId && inItems < 0 ? find(autoplay, rawAutoplay) : -1

    const header = asObject(queue.header)
    return {
      source: asString(asObject(asList(asObject(header?.subtitle)?.runs)[0])?.text),
      items,
      autoplay,
      current:
        inItems >= 0
          ? { list: "items", index: inItems }
          : inAutoplay >= 0
            ? { list: "autoplay", index: inAutoplay }
            : null,
      shuffle: queue.shuffleEnabled === true,
      repeat: queue.repeatMode === "ALL" ? "all" : queue.repeatMode === "ONE" ? "one" : "none"
    }
  }

  // Must go through the app's handler: `ytmusic-app.navigate` is a no-op and `loadVideoById`
  // bypasses the queue. Only endpoints built here or taken from the page's own queue get passed on.
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
        ...(playlistId && { playlistId }),
        ...(playlistId && Number.isInteger(index) && { index }),
        ...(musicVideoType && {
          watchEndpointMusicSupportedConfigs: { watchEndpointMusicConfig: { musicVideoType } }
        })
      }
    })

  const playPlaylist = (playlistId: string, params?: string): void =>
    navigate({ watchPlaylistEndpoint: { playlistId, ...(params && { params }) } })

  const playQueueItem = (list: "items" | "autoplay", index: number): void => {
    const queue = getQueueStore()
    const entries = asList(list === "autoplay" ? queue?.automixItems : queue?.items)
    const endpoint = rowRenderers(entries[index]).primary?.navigationEndpoint
    if (endpoint) navigate(endpoint as Record<string, unknown>)
  }

  const command = (cmd: YtmCommand): void => {
    if (cmd.type === "playQueueItem") {
      playQueueItem(cmd.list, cmd.index)
      return
    }
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

  // Without this header YouTube answers as if signed out, e.g. playlists come back as music videos.
  const authorizationHeader = async (origin: string): Promise<string | null> => {
    const sapisid = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("SAPISID="))
      ?.slice("SAPISID=".length)
    if (!sapisid) return null

    const timestamp = Math.floor(Date.now() / 1000)
    return `SAPISIDHASH ${timestamp}_${await sha1Hex(`${timestamp} ${sapisid} ${origin}`)}`
  }

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

  host.__yumuBridge = { getState, getQueue, command, request }
}
