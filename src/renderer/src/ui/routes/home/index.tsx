import ArtistSection from "@renderer/components/features/artist/ArtistSection"
import { Button } from "@renderer/components/ui/button"
import { useHome } from "@renderer/queries/home"
import { createFileRoute } from "@tanstack/react-router"
import { Disc3Icon } from "lucide-react"

export const Route = createFileRoute("/home/")({
  component: HomePage
})

function HomePage() {
  const { data, error, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useHome()

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-18.5">
      {isPending && (
        <div className="text-muted-foreground absolute inset-0 z-10 flex items-center justify-center text-sm">
          <Disc3Icon className="text-primary size-10 animate-spin" />
          <span className="sr-only">Loading…</span>
        </div>
      )}
      {error && <p className="text-destructive p-4 text-sm">{error.message}</p>}
      {data && (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
          {data.pages.flatMap((page, p) =>
            page.sections.map((section, i) => (
              <ArtistSection key={`${p}:${i}:${section.title}`} section={section} />
            ))
          )}
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
