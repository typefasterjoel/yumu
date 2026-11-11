import { parseTrack, type BrowseTrack } from "@ipc/youtube/parse-browse"
import { at, list, runTexts, str, thumbnailFrom, type Json } from "@ipc/youtube/parse-utils"

type PlaylistTarget = { playlistId: string; params?: string }

export type ArtistHeader = {
  name: string
  description: string
  /** As YouTube Music words it, e.g. "32M monthly audience". */
  monthlyListeners: string
  /** e.g. "4.68M". */
  subscribers: string
  thumbnail: string
  shuffle: PlaylistTarget | null
  radio: PlaylistTarget | null
}

type ItemBase = { title: string; subtitle: string; thumbnail: string }

export type ArtistItem =
  | (ItemBase & {
      /** Singles and EPs are albums too; the subtitle says which. */
      kind: "album" | "playlist"
      browseId: string
      /** What the card's play button plays. */
      play: PlaylistTarget | null
    })
  | (ItemBase & { kind: "artist"; browseId: string })
  | (ItemBase & { kind: "video"; videoId: string; musicVideoType?: string })

/** Where a section's "See all" goes. Only the targets we can show are kept. */
export type SeeAll =
  /** An ordinary playlist page, e.g. an artist's videos. */
  | { kind: "playlist"; browseId: string }
  /** A grid of every album or single, which needs the `params` of the section it came from. */
  | { kind: "grid"; browseId: string; params: string }

export type ArtistSection = {
  title: string
  items: ArtistItem[]
  seeAll: SeeAll | null
}

export type ArtistGrid = {
  items: ArtistItem[]
}

export type ArtistPage = {
  header: ArtistHeader
  topSongs: {
    tracks: BrowseTrack[]
    /** The full list of songs, an ordinary playlist page. */
    browseId: string | null
  } | null
  sections: ArtistSection[]
}

const playlistTarget = (endpoint: Json): PlaylistTarget | null => {
  const playlistId = str(at(endpoint, "playlistId"))
  if (!playlistId) return null
  const params = str(at(endpoint, "params"))
  return params ? { playlistId, params } : { playlistId }
}

const parseHeader = (header: Json): ArtistHeader => ({
  name: runTexts(at(header, "title", "runs")).join(""),
  description: runTexts(at(header, "description", "runs")).join(""),
  monthlyListeners: runTexts(at(header, "monthlyListenerCount", "runs")).join(""),
  subscribers: runTexts(
    at(header, "subscriptionButton", "subscribeButtonRenderer", "subscriberCountText", "runs")
  ).join(""),
  thumbnail: thumbnailFrom(
    at(header, "thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails")
  ),
  shuffle: playlistTarget(
    at(header, "playButton", "buttonRenderer", "navigationEndpoint", "watchEndpoint")
  ),
  radio: playlistTarget(
    at(header, "startRadioButton", "buttonRenderer", "navigationEndpoint", "watchEndpoint")
  )
})

// Cards are classified by where they link, never by the section's (translated) title. Podcasts and
// episodes aren't handled, so they return null and their sections come out empty.
const parseCard = (card: Json): ArtistItem | null => {
  const base: ItemBase = {
    title: runTexts(at(card, "title", "runs")).join(""),
    subtitle: runTexts(at(card, "subtitle", "runs")).join(""),
    thumbnail: thumbnailFrom(
      at(card, "thumbnailRenderer", "musicThumbnailRenderer", "thumbnail", "thumbnails")
    )
  }

  const watchEndpoint = at(card, "navigationEndpoint", "watchEndpoint")
  const videoId = str(at(watchEndpoint, "videoId"))
  if (videoId) {
    return {
      ...base,
      kind: "video",
      videoId,
      musicVideoType: str(
        at(
          watchEndpoint,
          "watchEndpointMusicSupportedConfigs",
          "watchEndpointMusicConfig",
          "musicVideoType"
        )
      )
    }
  }

  const browseEndpoint = at(card, "navigationEndpoint", "browseEndpoint")
  const browseId = str(at(browseEndpoint, "browseId"))
  const pageType = str(
    at(
      browseEndpoint,
      "browseEndpointContextSupportedConfigs",
      "browseEndpointContextMusicConfig",
      "pageType"
    )
  )
  if (!browseId) return null

  if (pageType === "MUSIC_PAGE_TYPE_ARTIST") return { ...base, kind: "artist", browseId }

  const kind =
    pageType === "MUSIC_PAGE_TYPE_ALBUM"
      ? "album"
      : pageType === "MUSIC_PAGE_TYPE_PLAYLIST"
        ? "playlist"
        : null
  if (!kind) return null

  return {
    ...base,
    kind,
    browseId,
    play: playlistTarget(
      at(
        card,
        "thumbnailOverlay",
        "musicItemThumbnailOverlayRenderer",
        "content",
        "musicPlayButtonRenderer",
        "playNavigationEndpoint",
        "watchPlaylistEndpoint"
      )
    )
  }
}

// Other "See all" links (live performances, playlists) point back at the artist page itself with
// extra params, which returns the same page again, so they are left out.
const parseSeeAll = (endpoint: Json): SeeAll | null => {
  const browseId = str(at(endpoint, "browseId"))
  if (!browseId) return null
  if (browseId.startsWith("VL")) return { kind: "playlist", browseId }
  const params = str(at(endpoint, "params"))
  return browseId.startsWith("MPAD") && params ? { kind: "grid", browseId, params } : null
}

const sectionListOf = (response: Json): Json[] =>
  list(
    at(
      response,
      "contents",
      "singleColumnBrowseResultsRenderer",
      "tabs",
      0,
      "tabRenderer",
      "content",
      "sectionListRenderer",
      "contents"
    ) ??
      // Some artist pages use the two-column layout instead.
      at(
        response,
        "contents",
        "twoColumnBrowseResultsRenderer",
        "tabs",
        0,
        "tabRenderer",
        "content",
        "sectionListRenderer",
        "contents"
      )
  )

export function parseArtistResponse(response: Json): ArtistPage | null {
  const header = at(response, "header", "musicImmersiveHeaderRenderer")
  if (!header) {
    console.warn("Artist response had no recognizable header; its shape may have changed.")
    return null
  }

  let topSongs: ArtistPage["topSongs"] = null
  const sections: ArtistSection[] = []

  for (const section of sectionListOf(response)) {
    const shelf = at(section, "musicShelfRenderer")
    if (shelf) {
      let index = 0
      const tracks = list(at(shelf, "contents")).flatMap((entry) => {
        const row = at(entry, "musicResponsiveListItemRenderer")
        if (!row) return []
        const track = parseTrack(row, index)
        if (track.videoId) index += 1
        return [track]
      })
      topSongs = {
        tracks,
        browseId:
          str(at(shelf, "title", "runs", 0, "navigationEndpoint", "browseEndpoint", "browseId")) ??
          null
      }
      continue
    }

    const carousel = at(section, "musicCarouselShelfRenderer")
    if (!carousel) continue
    const items = list(at(carousel, "contents"))
      .map((entry) => parseCard(at(entry, "musicTwoRowItemRenderer")))
      .filter((item): item is ArtistItem => item !== null)
    if (!items.length) continue

    const title = at(
      carousel,
      "header",
      "musicCarouselShelfBasicHeaderRenderer",
      "title",
      "runs",
      0
    )
    sections.push({
      title: str(at(title, "text")) ?? "",
      items,
      seeAll: parseSeeAll(at(title, "navigationEndpoint", "browseEndpoint"))
    })
  }

  return { header: parseHeader(header), topSongs, sections }
}

/** The page behind an album or single "See all": one grid of cards. */
export function parseArtistGridResponse(response: Json): ArtistGrid | null {
  const grid = at(
    response,
    "contents",
    "singleColumnBrowseResultsRenderer",
    "tabs",
    0,
    "tabRenderer",
    "content",
    "sectionListRenderer",
    "contents",
    0,
    "gridRenderer"
  )
  if (!grid) {
    console.warn("Artist list response had no recognizable grid; its shape may have changed.")
    return null
  }

  return {
    items: list(at(grid, "items"))
      .map((entry) => parseCard(at(entry, "musicTwoRowItemRenderer")))
      .filter((item): item is ArtistItem => item !== null)
  }
}
