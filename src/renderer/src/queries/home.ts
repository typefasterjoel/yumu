import { browseHome } from "@ipc/youtube/browse"
import { useInfiniteQuery } from "@tanstack/react-query"

export function useHome() {
  return useInfiniteQuery({
    queryKey: ["home"],
    queryFn: ({ pageParam }) => browseHome(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.continuation ?? undefined,
    staleTime: 5 * 60 * 1000
  })
}
