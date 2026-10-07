type Base = {
  title: string
  /** Everything after the type label, e.g. "Michael Jackson • 1982". */
  subtitle: string
  thumbnail: string
}

export type PlayableResult = Base & {
  /** `song` is an audio track; `video` is an official or user-uploaded video. */
  kind: "song" | "video" | "episode"
  videoId: string
  /** Passed back when playing, so YouTube Music treats it like a click on the result. */
  musicVideoType?: string
}

export type BrowseResult = Base & {
  kind: "artist" | "album" | "playlist"
  browseId: string
}

export type SearchResult = PlayableResult | BrowseResult

export type SearchResults = {
  topResult: SearchResult | null
  results: SearchResult[]
}

// The Innertube response is deeply nested and changes without notice, so everything is read
// defensively: anything that isn't the expected shape is skipped rather than thrown on.
type Json = unknown

const at = (value: Json, ...path: (string | number)[]): Json =>
  path.reduce<Json>(
    (current, key) =>
      current && typeof current === "object" ? (current as Record<string, Json>)[key] : undefined,
    value
  )

const str = (value: Json): string | undefined => (typeof value === "string" ? value : undefined)
const list = (value: Json): Json[] => (Array.isArray(value) ? value : [])
const runTexts = (runs: Json): string[] => list(runs).map((run) => str(at(run, "text")) ?? "")

/** Drops the leading type label ("Song", "Album", …) and the separator after it. */
const subtitleFromRuns = (runs: Json): string => {
  const texts = runTexts(runs)
  return texts
    .slice(texts[1]?.trim() === "•" ? 2 : 1)
    .join("")
    .trim()
}

const thumbnailFrom = (thumbnails: Json): string => {
  // Sorted smallest to largest.
  const largest = list(thumbnails).at(-1)
  return str(at(largest, "url")) ?? ""
}

// Classifying by endpoint rather than by the "Song" / "Album" label keeps this working for
// non-English users, where the label is translated.
const classify = (watchEndpoint: Json, browseEndpoint: Json, base: Base): SearchResult | null => {
  const videoId = str(at(watchEndpoint, "videoId"))
  if (videoId) {
    const musicVideoType = str(
      at(
        watchEndpoint,
        "watchEndpointMusicSupportedConfigs",
        "watchEndpointMusicConfig",
        "musicVideoType"
      )
    )
    const kind =
      musicVideoType === "MUSIC_VIDEO_TYPE_ATV"
        ? "song"
        : musicVideoType === "MUSIC_VIDEO_TYPE_PODCAST_EPISODE"
          ? "episode"
          : "video"
    return { ...base, kind, videoId, musicVideoType }
  }

  const browseId = str(at(browseEndpoint, "browseId"))
  const pageType = str(
    at(
      browseEndpoint,
      "browseEndpointContextSupportedConfigs",
      "browseEndpointContextMusicConfig",
      "pageType"
    )
  )
  const kind =
    pageType === "MUSIC_PAGE_TYPE_ARTIST"
      ? "artist"
      : pageType === "MUSIC_PAGE_TYPE_ALBUM"
        ? "album"
        : pageType === "MUSIC_PAGE_TYPE_PLAYLIST"
          ? "playlist"
          : null
  return browseId && kind ? { ...base, kind, browseId } : null
}

const parseListItem = (item: Json): SearchResult | null => {
  const columnRuns = (index: number) =>
    at(item, "flexColumns", index, "musicResponsiveListItemFlexColumnRenderer", "text", "runs")

  return classify(
    at(
      item,
      "overlay",
      "musicItemThumbnailOverlayRenderer",
      "content",
      "musicPlayButtonRenderer",
      "playNavigationEndpoint",
      "watchEndpoint"
    ),
    at(item, "navigationEndpoint", "browseEndpoint"),
    {
      title: runTexts(columnRuns(0)).join(""),
      subtitle: subtitleFromRuns(columnRuns(1)),
      thumbnail: thumbnailFrom(
        at(item, "thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails")
      )
    }
  )
}

// The "top result" card is shaped differently from the list items: its endpoint sits on the
// title run. Its `contents` are only "more from YouTube" extras, so they're ignored.
const parseTopResultCard = (card: Json): SearchResult | null => {
  const titleRun = at(card, "title", "runs", 0)

  return classify(
    at(titleRun, "navigationEndpoint", "watchEndpoint"),
    at(titleRun, "navigationEndpoint", "browseEndpoint"),
    {
      title: str(at(titleRun, "text")) ?? "",
      subtitle: subtitleFromRuns(at(card, "subtitle", "runs")),
      thumbnail: thumbnailFrom(
        at(card, "thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails")
      )
    }
  )
}

export function parseSearchResponse(response: Json): SearchResults {
  const sections = list(
    at(
      response,
      "contents",
      "tabbedSearchResultsRenderer",
      "tabs",
      0,
      "tabRenderer",
      "content",
      "sectionListRenderer",
      "contents"
    )
  )

  let topResult: SearchResult | null = null
  const results: SearchResult[] = []

  for (const section of sections) {
    const card = at(section, "musicCardShelfRenderer")
    if (card) {
      topResult = parseTopResultCard(card)
      continue
    }

    // Depending on the layout, items arrive grouped under a shelf or one per item section.
    const entries = [
      ...list(at(section, "itemSectionRenderer", "contents")),
      ...list(at(section, "musicShelfRenderer", "contents"))
    ]
    for (const entry of entries) {
      const parsed = parseListItem(at(entry, "musicResponsiveListItemRenderer"))
      if (parsed) results.push(parsed)
    }
  }

  if (!topResult && !results.length) {
    console.warn("Search response had no recognizable results; its shape may have changed.")
  }

  return { topResult, results }
}
