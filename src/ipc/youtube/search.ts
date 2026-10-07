import { requestInnertube } from "@ipc/youtube/commands"
import { parseSearchResponse, type SearchResults } from "@ipc/youtube/parse-search"

export async function searchYoutubeMusic(query: string): Promise<SearchResults> {
  return parseSearchResponse(await requestInnertube("search", { query }))
}
