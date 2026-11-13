import { requestInnertube } from "@ipc/youtube/commands"
import {
  parseArtistGridResponse,
  parseArtistResponse,
  type ArtistGrid,
  type ArtistPage
} from "@ipc/youtube/parse-artist"
import { parseHomeContinuation, parseHomeResponse, type HomePage } from "@ipc/youtube/parse-home"
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

export async function browseHome(token?: string): Promise<HomePage> {
  if (token) return parseHomeContinuation(await requestInnertube("browse", { continuation: token }))
  const page = parseHomeResponse(await requestInnertube("browse", { browseId: "FEmusic_home" }))
  if (!page) throw new Error("The home page couldn't be read; YouTube Music may have changed it.")
  return page
}
