import { parseCard, type ArtistItem, type ArtistSection } from "@ipc/youtube/parse-artist"
import { at, list, str, type Json } from "@ipc/youtube/parse-utils"

/** A home row is the same shape as an artist page section: a titled row of cards. */
export type HomeSection = ArtistSection

export type HomePage = {
  sections: HomeSection[]
  /** Token for the next batch of rows; null on the last page. */
  continuation: string | null
}

const nextToken = (sectionList: Json): string | null =>
  str(at(sectionList, "continuations", 0, "nextContinuationData", "continuation")) ?? null

// Only carousels of cards are shown. Song-row shelves ("Long listens") and episodes aren't handled
// yet, so they come out empty and the row is dropped.
function parseSections(rows: Json[]): HomeSection[] {
  const sections: HomeSection[] = []
  for (const row of rows) {
    const carousel = at(row, "musicCarouselShelfRenderer")
    if (!carousel) continue

    const items = list(at(carousel, "contents"))
      .map((entry) => parseCard(at(entry, "musicTwoRowItemRenderer")))
      .filter((item): item is ArtistItem => item !== null)
    if (!items.length) continue

    // Some rows carry only a strapline (e.g. "MORE FROM") instead of a title.
    const header = at(carousel, "header", "musicCarouselShelfBasicHeaderRenderer")
    const title =
      str(at(header, "title", "runs", 0, "text")) ??
      str(at(header, "strapline", "runs", 0, "text")) ??
      ""
    sections.push({ title, items, seeAll: null })
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
