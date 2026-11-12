import { parseCard, type ArtistItem, type ArtistSection } from "@ipc/youtube/parse-artist"
import { parseTrack, type BrowseTrack } from "@ipc/youtube/parse-browse"
import { at, list, str, type Json } from "@ipc/youtube/parse-utils"

/** A row of cards, shaped like an artist page section. */
export type HomeCardSection = ArtistSection & { kind: "cards" }

/** A shelf of song rows, e.g. song mixes or long listens. */
export type HomeTrackSection = { kind: "tracks"; title: string; tracks: BrowseTrack[] }

export type HomeSection = HomeCardSection | HomeTrackSection

export type HomePage = {
  sections: HomeSection[]
  /** Token for the next batch of rows; null on the last page. */
  continuation: string | null
}

const nextToken = (sectionList: Json): string | null =>
  str(at(sectionList, "continuations", 0, "nextContinuationData", "continuation")) ?? null

// Episodes (`musicMultiRowListItemRenderer`) aren't handled, so a row of them comes out empty and
// is dropped.
function parseSections(rows: Json[]): HomeSection[] {
  const sections: HomeSection[] = []
  for (const row of rows) {
    const carousel = at(row, "musicCarouselShelfRenderer")
    if (!carousel) continue
    const entries = list(at(carousel, "contents"))

    // Some rows carry only a strapline (e.g. "MORE FROM") instead of a title.
    const header = at(carousel, "header", "musicCarouselShelfBasicHeaderRenderer")
    const title =
      str(at(header, "title", "runs", 0, "text")) ??
      str(at(header, "strapline", "runs", 0, "text")) ??
      ""

    const items = entries
      .map((entry) => parseCard(at(entry, "musicTwoRowItemRenderer")))
      .filter((item): item is ArtistItem => item !== null)
    if (items.length) sections.push({ kind: "cards", title, items, seeAll: null })

    // Each song row's play endpoint is its own radio, which starts with that song, so none of them
    // is at its position in the shelf.
    const tracks = entries
      .flatMap((entry) => {
        const songRow = at(entry, "musicResponsiveListItemRenderer")
        return songRow ? [parseTrack(songRow, 0)] : []
      })
      .filter((track) => track.videoId !== null)
    if (tracks.length) sections.push({ kind: "tracks", title, tracks })
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
  return {
    sections: parseSections(list(at(sectionList, "contents"))),
    continuation: nextToken(sectionList)
  }
}
