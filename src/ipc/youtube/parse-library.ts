import { parseCard, type ArtistItem } from "@ipc/youtube/parse-artist"
import { at, list, runTexts, str, thumbnailFrom, type Json } from "@ipc/youtube/parse-utils"

export type LibraryTab = "playlists" | "albums" | "artists"

export const LIBRARY_BROWSE_IDS: Record<LibraryTab, string> = {
  playlists: "FEmusic_liked_playlists",
  albums: "FEmusic_liked_albums",
  artists: "FEmusic_library_corpus_artists"
}

export type LibraryPage = {
  items: ArtistItem[]
  continuation: string | null
}

const parseArtistRow = (row: Json): ArtistItem | null => {
  const browseId = str(at(row, "navigationEndpoint", "browseEndpoint", "browseId"))
  const column = (position: number) =>
    runTexts(
      at(row, "flexColumns", position, "musicResponsiveListItemFlexColumnRenderer", "text", "runs")
    ).join("")
  const title = column(0)
  if (!browseId || !title) return null

  return {
    kind: "artist",
    browseId,
    title,
    subtitle: column(1),
    thumbnail: thumbnailFrom(
      at(row, "thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails")
    )
  }
}

const parseEntry = (entry: Json): ArtistItem | null => {
  const card = at(entry, "musicTwoRowItemRenderer")
  const item = card ? parseCard(card) : parseArtistRow(at(entry, "musicResponsiveListItemRenderer"))
  // The grid starts with a "New playlist" tile that links nowhere.
  return item?.kind === "unknown" ? null : item
}

const parseBody = (body: Json): LibraryPage => ({
  items: list(at(body, "items") ?? at(body, "contents"))
    .map(parseEntry)
    .filter((item): item is ArtistItem => item !== null),
  continuation: str(at(body, "continuations", 0, "nextContinuationData", "continuation")) ?? null
})

export function parseLibraryResponse(response: Json): LibraryPage | null {
  const first = at(
    response,
    "contents",
    "singleColumnBrowseResultsRenderer",
    "tabs",
    0,
    "tabRenderer",
    "content",
    "sectionListRenderer",
    "contents",
    0
  )
  const body = at(first, "gridRenderer") ?? at(first, "musicShelfRenderer")
  if (!body) {
    console.warn("Library response had no recognizable list; its shape may have changed.")
    return null
  }
  return parseBody(body)
}

export function parseLibraryContinuation(response: Json): LibraryPage {
  const continuation = at(response, "continuationContents")
  return parseBody(
    at(continuation, "gridContinuation") ?? at(continuation, "musicShelfContinuation")
  )
}
