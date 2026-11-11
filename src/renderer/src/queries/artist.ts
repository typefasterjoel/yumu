import { browseArtist, browseArtistGrid } from "@ipc/youtube/browse"
import { useQuery } from "@tanstack/react-query"

export function useArtist(browseId: string) {
  return useQuery({
    queryKey: ["artist", browseId],
    queryFn: () => browseArtist(browseId),
    staleTime: 5 * 60 * 1000
  })
}

export function useArtistGrid(browseId: string, params: string) {
  return useQuery({
    queryKey: ["artist-grid", browseId, params],
    queryFn: () => browseArtistGrid(browseId, params),
    staleTime: 5 * 60 * 1000
  })
}
