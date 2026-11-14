import { browseLibrary, browseWholeLibrary } from "@ipc/youtube/browse"
import type { BrowseResult } from "@ipc/youtube/parse-search"
import type { LibraryTab } from "@ipc/youtube/parse-library"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

export function useLibrary(tab: LibraryTab) {
  return useInfiniteQuery({
    queryKey: ["library", tab],
    queryFn: ({ pageParam }) => browseLibrary(tab, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.continuation ?? undefined,
    staleTime: 5 * 60 * 1000
  })
}

const LIBRARY_TABS: LibraryTab[] = ["playlists", "albums", "artists"]

/** Everything in the library that can be opened, for searching it by name. */
export function useLibraryItems(enabled: boolean) {
  return useQuery({
    queryKey: ["library-all"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BrowseResult[]> => {
      // One tab failing shouldn't hide the others.
      const settled = await Promise.allSettled(LIBRARY_TABS.map(browseWholeLibrary))
      return settled
        .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
        .flatMap((item) =>
          item.kind === "album" || item.kind === "playlist" || item.kind === "artist"
            ? [
                {
                  kind: item.kind,
                  browseId: item.browseId,
                  title: item.title,
                  subtitle: item.subtitle,
                  thumbnail: item.thumbnail
                }
              ]
            : []
        )
    }
  })
}
