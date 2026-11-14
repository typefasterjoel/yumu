import { requestInnertube } from "@ipc/youtube/commands"
import {
  parseArtistGridResponse,
  type ArtistItem,
  parseArtistResponse,
  type ArtistGrid,
  type ArtistPage
} from "@ipc/youtube/parse-artist"
import { parseHomeContinuation, parseHomeResponse, type HomePage } from "@ipc/youtube/parse-home"
import {
  LIBRARY_BROWSE_IDS,
  parseLibraryContinuation,
  parseLibraryResponse,
  type LibraryPage,
  type LibraryTab
} from "@ipc/youtube/parse-library"
import {
  parseBrowseContinuation,
  parseBrowseResponse,
  type BrowseContinuation,
  type BrowsePage
} from "@ipc/youtube/parse-browse"

export async function browseYoutubeMusic(browseId: string): Promise<BrowsePage> {
  const page = parseBrowseResponse(await requestInnertube("browse", { browseId }))
  if (!page) throw new Error("This page couldn't be read; YouTube Music may have changed it.")
  return page
}

export async function browseArtist(browseId: string): Promise<ArtistPage> {
  // Library links can carry an "MPLA" prefix the artist page itself doesn't accept.
  const page = parseArtistResponse(
    await requestInnertube("browse", { browseId: browseId.replace(/^MPLA/, "") })
  )
  if (!page) throw new Error("This page couldn't be read; YouTube Music may have changed it.")
  return page
}

export async function browseArtistGrid(browseId: string, params: string): Promise<ArtistGrid> {
  const grid = parseArtistGridResponse(await requestInnertube("browse", { browseId, params }))
  if (!grid) throw new Error("This page couldn't be read; YouTube Music may have changed it.")
  return grid
}

export async function browseContinuation(
  token: string,
  startIndex: number
): Promise<BrowseContinuation> {
  return parseBrowseContinuation(
    await requestInnertube("browse", { continuation: token }),
    startIndex
  )
}

export async function browseLibrary(tab: LibraryTab, token?: string): Promise<LibraryPage> {
  if (token) {
    return parseLibraryContinuation(await requestInnertube("browse", { continuation: token }))
  }
  const page = parseLibraryResponse(
    await requestInnertube("browse", { browseId: LIBRARY_BROWSE_IDS[tab] })
  )
  if (!page) throw new Error("Your library couldn't be read; YouTube Music may have changed it.")
  return page
}

const MAX_LIBRARY_PAGES = 20

export async function browseWholeLibrary(tab: LibraryTab): Promise<ArtistItem[]> {
  const items: ArtistItem[] = []
  let page = await browseLibrary(tab)
  for (let i = 0; ; i++) {
    items.push(...page.items)
    if (!page.continuation || i >= MAX_LIBRARY_PAGES) return items
    page = await browseLibrary(tab, page.continuation)
  }
}

export async function browseHome(token?: string): Promise<HomePage> {
  if (token) return parseHomeContinuation(await requestInnertube("browse", { continuation: token }))
  const page = parseHomeResponse(await requestInnertube("browse", { browseId: "FEmusic_home" }))
  if (!page) throw new Error("The home page couldn't be read; YouTube Music may have changed it.")
  return page
}
