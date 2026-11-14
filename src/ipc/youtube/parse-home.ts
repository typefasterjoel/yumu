import { parseCarouselEntry, type ArtistItem, type ArtistSection } from "@ipc/youtube/parse-artist"
import { parseTrack, type BrowseTrack } from "@ipc/youtube/parse-browse"
import { at, list, str, type Json } from "@ipc/youtube/parse-utils"

export type HomeCardSection = ArtistSection & { kind: "cards" }

export type HomeTrackSection = {
  kind: "tracks"
  title: string
  tracks: BrowseTrack[]
  rowsPerColumn: number
}

export type HomeSection = HomeCardSection | HomeTrackSection

export type HomePage = {
  sections: HomeSection[]
  continuation: string | null
}

const DEFAULT_ROWS_PER_COLUMN = 4
const MAX_ROWS_PER_COLUMN = 6

const rowsPerColumnOf = (carousel: Json): number => {
  const rows = Number(at(carousel, "numItemsPerColumn"))
  return Number.isInteger(rows) && rows > 0
    ? Math.min(rows, MAX_ROWS_PER_COLUMN)
    : DEFAULT_ROWS_PER_COLUMN
}

const nextToken = (sectionList: Json): string | null =>
  str(at(sectionList, "continuations", 0, "nextContinuationData", "continuation")) ?? null

function parseSections(rows: Json[]): HomeSection[] {
  const sections: HomeSection[] = []
  for (const row of rows) {
    const carousel = at(row, "musicCarouselShelfRenderer")
    if (!carousel) continue
    const entries = list(at(carousel, "contents"))

    const header = at(carousel, "header", "musicCarouselShelfBasicHeaderRenderer")
    const title =
      str(at(header, "title", "runs", 0, "text")) ??
      str(at(header, "strapline", "runs", 0, "text")) ??
      ""

    const items = entries
      .filter((entry) => !at(entry, "musicResponsiveListItemRenderer"))
      .map(parseCarouselEntry)
      .filter((item): item is ArtistItem => item !== null)
    if (items.length) sections.push({ kind: "cards", title, items, seeAll: null })

    // Each song row's play endpoint is its own radio starting with that song, so the index is 0.
    const tracks = entries
      .flatMap((entry) => {
        const songRow = at(entry, "musicResponsiveListItemRenderer")
        return songRow ? [parseTrack(songRow, 0)] : []
      })
      .filter((track) => track.videoId !== null)
    if (tracks.length) {
      sections.push({ kind: "tracks", title, tracks, rowsPerColumn: rowsPerColumnOf(carousel) })
    }
  }
  return sections
}

export function parseHomeResponse(response: Json): HomePage | null {
  const sectionList = at(
    response,
    "contents",
    "singleColumnBrowseResultsRenderer",
    "tabs",
    0,
    "tabRenderer",
    "content",
    "sectionListRenderer"
  )
  if (!sectionList) {
    console.warn("Home response had no recognizable section list; its shape may have changed.")
    return null
  }
  return {
    sections: parseSections(list(at(sectionList, "contents"))),
    continuation: nextToken(sectionList)
  }
}

export function parseHomeContinuation(response: Json): HomePage {
  const sectionList = at(response, "continuationContents", "sectionListContinuation")
  if (!sectionList) {
    console.warn("Home continuation had no recognizable section list; its shape may have changed.")
  }
  return {
    sections: parseSections(list(at(sectionList, "contents"))),
    continuation: nextToken(sectionList)
  }
}
