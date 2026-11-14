import { browseLibrary } from "@ipc/youtube/browse"
import type { LibraryTab } from "@ipc/youtube/parse-library"
import { useInfiniteQuery } from "@tanstack/react-query"

export function useLibrary(tab: LibraryTab) {
  return useInfiniteQuery({
    queryKey: ["library", tab],
    queryFn: ({ pageParam }) => browseLibrary(tab, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.continuation ?? undefined,
    staleTime: 5 * 60 * 1000
  })
}
