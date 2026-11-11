import CollectionHeader from "@renderer/components/features/browse/CollectionHeader"
import TrackRow from "@renderer/components/features/browse/TrackRow"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from "@renderer/components/ui/breadcrumb"
import { Button } from "@renderer/components/ui/button"
import { useBrowse } from "@renderer/queries/browse"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { ArrowLeft, Disc3Icon } from "lucide-react"

export const Route = createFileRoute("/browse/$browseId/")({
  component: BrowsePage
})

// Album and playlist page.
function BrowsePage() {
  const { browseId } = Route.useParams()
  const router = useRouter()
  const { data, error, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useBrowse(browseId)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-18.5">
      {isPending && (
        <div className="text-muted-foreground absolute inset-0 z-10 flex items-center justify-center text-sm">
          <Disc3Icon className="text-primary size-10 animate-spin" />
          <span className="sr-only">Loading…</span>
        </div>
      )}
      <div className="bg-card p-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="inline-flex cursor-pointer items-center gap-1"
                onClick={() => router.history.back()}
              >
                <ArrowLeft className="size-4" /> Back
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {error && <p className="text-destructive text-sm">{error.message}</p>}
      {data && (
        <div className="flex overflow-hidden">
          <CollectionHeader header={data.header} />
          <ul className="flex min-h-0 grow flex-col gap-2 overflow-y-auto p-4">
            {data.tracks.map((track, i) => (
              <TrackRow
                key={`${i}:${track.videoId ?? track.title}`}
                track={track}
                position={i + 1}
              />
            ))}
            {hasNextPage && (
              <li>
                <Button
                  variant="ghost"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
