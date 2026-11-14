import type { LibraryTab } from "@ipc/youtube/parse-library"
import ArtistCard from "@renderer/components/features/artist/ArtistCard"
import { Button } from "@renderer/components/ui/button"
import { useLibrary } from "@renderer/queries/library"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Disc3Icon } from "lucide-react"

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "playlists", label: "Playlists" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" }
]

export const Route = createFileRoute("/library/")({
  validateSearch: (search: Record<string, unknown>): { tab: LibraryTab } => ({
    tab: TABS.some((tab) => tab.id === search.tab) ? (search.tab as LibraryTab) : "playlists"
  }),
  component: LibraryPage
})

function LibraryPage() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate()
  const { data, error, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useLibrary(tab)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-18.5">
      {isPending && (
        <div className="text-muted-foreground absolute inset-0 z-10 flex items-center justify-center text-sm">
          <Disc3Icon className="text-primary size-10 animate-spin" />
          <span className="sr-only">Loading…</span>
        </div>
      )}
      <div className="bg-card flex gap-1 p-2">
        {TABS.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            variant={id === tab ? "secondary" : "ghost"}
            onClick={() => navigate({ to: "/library", search: { tab: id } })}
          >
            {label}
          </Button>
        ))}
      </div>
      {error && <p className="text-destructive p-4 text-sm">{error.message}</p>}
      {data && (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {data.pages
              .flatMap((page) => page.items)
              .map((item, i) => (
                <ArtistCard key={`${i}:${item.title}`} item={item} />
              ))}
          </ul>
          {hasNextPage && (
            <Button
              variant="ghost"
              className="self-center"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
