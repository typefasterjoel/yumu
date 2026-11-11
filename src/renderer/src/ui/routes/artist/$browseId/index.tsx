import ArtistHeader from "@renderer/components/features/artist/ArtistHeader"
import ArtistSection from "@renderer/components/features/artist/ArtistSection"
import TrackRow from "@renderer/components/features/browse/TrackRow"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from "@renderer/components/ui/breadcrumb"
import { useArtist } from "@renderer/queries/artist"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { ArrowLeft, Disc3Icon } from "lucide-react"

export const Route = createFileRoute("/artist/$browseId/")({
  component: ArtistPage
})

function ArtistPage() {
  const { browseId } = Route.useParams()
  const router = useRouter()
  const { data, error, isPending } = useArtist(browseId)

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
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <ArtistHeader header={data.header} />
          {data.topSongs && data.topSongs.tracks.length > 0 && (
            <section className="flex flex-col gap-2 px-4">
              <h2 className="m-0 px-2 text-xl font-bold">
                {data.topSongs.browseId ? (
                  <Link
                    to="/browse/$browseId"
                    params={{ browseId: data.topSongs.browseId }}
                    className="hover:underline"
                  >
                    Top songs
                  </Link>
                ) : (
                  "Top songs"
                )}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {data.topSongs.tracks.map((track, i) => (
                  <TrackRow
                    key={`${i}:${track.videoId ?? track.title}`}
                    track={track}
                    position={i + 1}
                  />
                ))}
              </ul>
            </section>
          )}
          <div className="flex flex-col gap-6 px-4">
            {data.sections.map((section, i) => (
              <ArtistSection key={`${i}:${section.title}`} section={section} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
