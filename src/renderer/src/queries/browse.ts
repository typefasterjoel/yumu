import { browseContinuation, browseYoutubeMusic } from "@ipc/youtube/browse"
import type { BrowseContinuation, BrowseHeader } from "@ipc/youtube/parse-browse"
import { useInfiniteQuery } from "@tanstack/react-query"

type PageParam = { token: string; startIndex: number } | null
// Only the first page carries the header; continuation pages are just more tracks.
type Page = BrowseContinuation & { header: BrowseHeader | null }

/** An album or playlist. Long playlists arrive in pages of about 100 tracks. */
export function useBrowse(browseId: string) {
  return useInfiniteQuery({
    queryKey: ["browse", browseId],
    initialPageParam: null as PageParam,
    queryFn: async ({ pageParam }): Promise<Page> =>
      pageParam
        ? { header: null, ...(await browseContinuation(pageParam.token, pageParam.startIndex)) }
        : browseYoutubeMusic(browseId),
    getNextPageParam: (last, pages): PageParam => {
      if (!last.continuation) return null
      // Indexes count playable tracks only, to match the queue YouTube Music builds.
      const startIndex = pages.reduce(
        (count, page) => count + page.tracks.filter((track) => track.videoId).length,
        0
      )
      return { token: last.continuation, startIndex }
    },
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      // The first page always comes from `browseYoutubeMusic`, which throws without a header.
      header: data.pages[0].header as BrowseHeader,
      tracks: data.pages.flatMap((page) => page.tracks)
    })
  })
}
