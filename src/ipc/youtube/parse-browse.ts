import {
  at,
  list,
  runTexts,
  str,
  subtitleFromRuns,
  thumbnailFrom,
  type Json
} from "@ipc/youtube/parse-utils"

export type BrowseHeader = {
  kind: "album" | "playlist"
  title: string
  /** Everything after the type label, e.g. "1982". */
  subtitle: string
  /** e.g. "9 songs • 42 minutes". */
  stats: string
  /** The album artist, or the playlist author when YouTube Music names one. */
  author: string
  thumbnail: string
  /** Plays the whole thing in order. */
  playlistId: string | null
  /** Plays the whole thing shuffled; `params` is what tells YouTube Music to shuffle. */
  shuffle: { playlistId: string; params: string } | null
}

export type TrackArtist = {
  name: string
  /** Null when the name isn't a page we can open (e.g. an uploaded video's channel). */
  browseId: string | null
}

export type BrowseTrack = {
  title: string
  artists: TrackArtist[]
  album: string
  /** As YouTube Music formats it, e.g. "6:04". */
  duration: string
  thumbnail: string
  /** Null for rows YouTube Music greys out (removed or unavailable). They can't be played. */
  videoId: string | null
  musicVideoType?: string
  playlistId: string | null
  /** Position in the queue YouTube Music builds, which skips unplayable rows. */
  index: number | null
}

export type BrowsePage = {
  header: BrowseHeader
  tracks: BrowseTrack[]
  /** Token for the next page of tracks, or null on the last page. */
  continuation: string | null
}

export type BrowseContinuation = Pick<BrowsePage, "tracks" | "continuation">

const musicConfigOf = (watchEndpoint: Json) =>
  str(
    at(
      watchEndpoint,
      "watchEndpointMusicSupportedConfigs",
      "watchEndpointMusicConfig",
      "musicVideoType"
    )
  )

const parseHeader = (response: Json): BrowseHeader | null => {
  const header = at(
    response,
    "contents",
    "twoColumnBrowseResultsRenderer",
    "tabs",
    0,
    "tabRenderer",
    "content",
    "sectionListRenderer",
    "contents",
    0,
    "musicResponsiveHeaderRenderer"
  )
  if (!header) return null

  const buttons = list(at(header, "buttons"))

  // Buttons are found by type and icon, never by their localized text.
  const playEndpoint = at(
    buttons.find((button) => at(button, "musicPlayButtonRenderer")),
    "musicPlayButtonRenderer",
    "playNavigationEndpoint"
  )
  const playlistId =
    str(at(playEndpoint, "watchPlaylistEndpoint", "playlistId")) ??
    str(at(playEndpoint, "watchEndpoint", "playlistId")) ??
    null

  const shuffleItem = list(
    at(
      buttons.find((button) => at(button, "menuRenderer")),
      "menuRenderer",
      "items"
    )
  )
    .map((item) => at(item, "menuNavigationItemRenderer"))
    .find((item) => at(item, "icon", "iconType") === "MUSIC_SHUFFLE")
  const shuffleEndpoint = at(shuffleItem, "navigationEndpoint", "watchPlaylistEndpoint")
  const shufflePlaylistId = str(at(shuffleEndpoint, "playlistId"))
  const shuffleParams = str(at(shuffleEndpoint, "params"))

  const ogType = str(at(response, "microformat", "microformatDataRenderer", "ogType"))

  return {
    kind: ogType === "music.album" ? "album" : "playlist",
    title: runTexts(at(header, "title", "runs")).join(""),
    subtitle: subtitleFromRuns(at(header, "subtitle", "runs")),
    stats: runTexts(at(header, "secondSubtitle", "runs"))
      .join("")
      .trim(),
    // Albums name the artist in a strapline; playlists only sometimes have a facepile.
    author:
      runTexts(at(header, "straplineTextOne", "runs")).join("") ||
      str(at(header, "facepile", "avatarStackViewModel", "text", "content")) ||
      "",
    thumbnail: thumbnailFrom(
      at(header, "thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails")
    ),
    playlistId,
    shuffle:
      shufflePlaylistId && shuffleParams
        ? { playlistId: shufflePlaylistId, params: shuffleParams }
        : null
  }
}

const columnRuns = (item: Json, position: number) =>
  at(item, "flexColumns", position, "musicResponsiveListItemFlexColumnRenderer", "text", "runs")

const columnText = (item: Json, position: number) =>
  runTexts(columnRuns(item, position)).join("").trim()

const pageTypeOf = (run: Json) =>
  str(
    at(
      run,
      "navigationEndpoint",
      "browseEndpoint",
      "browseEndpointContextSupportedConfigs",
      "browseEndpointContextMusicConfig",
      "pageType"
    )
  )

/**
 * Finds the column whose link goes to a page of this type. Position isn't reliable: the column
 * after the title is the artist in a playlist, empty in an album, and an album's third column is a
 * play count.
 */
const columnLinkedTo = (item: Json, pageType: string): number | undefined =>
  [1, 2, 3].find((position) => pageTypeOf(list(columnRuns(item, position))[0]) === pageType)

const parseArtists = (item: Json): TrackArtist[] => {
  const position = columnLinkedTo(item, "MUSIC_PAGE_TYPE_ARTIST")
  if (position !== undefined) {
    // A track with several artists has one linked run per artist, with separators between them.
    return list(columnRuns(item, position)).flatMap((run) =>
      pageTypeOf(run) === "MUSIC_PAGE_TYPE_ARTIST"
        ? [
            {
              name: str(at(run, "text")) ?? "",
              browseId: str(at(run, "navigationEndpoint", "browseEndpoint", "browseId")) ?? null
            }
          ]
        : []
    )
  }

  // Uploaded videos link their channel as a user channel, not an artist, so fall back to the text
  // of the column after the title. In an album that column is empty.
  const name = columnText(item, 1)
  return name ? [{ name, browseId: null }] : []
}

export const parseTrack = (item: Json, index: number): BrowseTrack => {
  const albumColumn = columnLinkedTo(item, "MUSIC_PAGE_TYPE_ALBUM")
  const endpoint = at(
    item,
    "overlay",
    "musicItemThumbnailOverlayRenderer",
    "content",
    "musicPlayButtonRenderer",
    "playNavigationEndpoint",
    "watchEndpoint"
  )
  const videoId = str(at(endpoint, "videoId")) ?? null

  return {
    title: columnText(item, 0),
    artists: parseArtists(item),
    album: albumColumn === undefined ? "" : columnText(item, albumColumn),
    duration: runTexts(
      at(item, "fixedColumns", 0, "musicResponsiveListItemFixedColumnRenderer", "text", "runs")
    )
      .join("")
      .trim(),
    thumbnail: thumbnailFrom(
      at(item, "thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails")
    ),
    videoId,
    musicVideoType: musicConfigOf(endpoint),
    playlistId: str(at(endpoint, "playlistId")) ?? null,
    index: videoId ? index : null
  }
}

/**
 * `startIndex` is how many playable tracks came before this batch, so later pages keep counting.
 * Rows without a play endpoint are kept, so the list matches the page, but get no index.
 */
const parseItems = (
  entries: Json[],
  startIndex: number
): { tracks: BrowseTrack[]; continuation: string | null } => {
  const tracks: BrowseTrack[] = []
  let continuation: string | null = null
  let index = startIndex

  for (const entry of entries) {
    const row = at(entry, "musicResponsiveListItemRenderer")
    if (row) {
      const track = parseTrack(row, index)
      if (track.videoId) index += 1
      tracks.push(track)
      continue
    }

    continuation =
      str(
        at(
          entry,
          "continuationItemRenderer",
          "continuationEndpoint",
          "continuationCommand",
          "token"
        )
      ) ?? continuation
  }

  return { tracks, continuation }
}

export function parseBrowseResponse(response: Json): BrowsePage | null {
  const header = parseHeader(response)
  if (!header) {
    console.warn("Browse response had no recognizable header; its shape may have changed.")
    return null
  }

  // Albums list their tracks in a plain shelf, playlists in a playlist shelf.
  const shelf = at(
    response,
    "contents",
    "twoColumnBrowseResultsRenderer",
    "secondaryContents",
    "sectionListRenderer",
    "contents",
    0
  )
  const entries = list(
    at(shelf, "musicShelfRenderer", "contents") ??
      at(shelf, "musicPlaylistShelfRenderer", "contents")
  )

  return { header, ...parseItems(entries, 0) }
}

export function parseBrowseContinuation(response: Json, startIndex: number): BrowseContinuation {
  return parseItems(
    list(
      at(
        response,
        "onResponseReceivedActions",
        0,
        "appendContinuationItemsAction",
        "continuationItems"
      )
    ),
    startIndex
  )
}
