import { searchYoutubeMusic } from "@ipc/youtube/search"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

const MIN_QUERY_LENGTH = 2

export function useSearch(query: string) {
  const trimmed = query.trim()
  const enabled = trimmed.length >= MIN_QUERY_LENGTH

  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => searchYoutubeMusic(trimmed),
    enabled,
    staleTime: 5 * 60 * 1000,
    // Keep showing the last results while the next query loads, so typing doesn't flash empty.
    // Not when the query is too short to run: clearing the box should clear the results.
    placeholderData: enabled ? keepPreviousData : undefined
  })
}
