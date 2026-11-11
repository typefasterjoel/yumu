import ArtistCard from "@renderer/components/features/artist/ArtistCard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from "@renderer/components/ui/breadcrumb"
import { useArtistGrid } from "@renderer/queries/artist"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { ArrowLeft, Disc3Icon } from "lucide-react"

export const Route = createFileRoute("/artist/$browseId/all")({
  // `params` is what tells YouTube Music which list this is (albums or singles).
  validateSearch: (search: Record<string, unknown>): { params: string; title?: string } => ({
    params: typeof search.params === "string" ? search.params : "",
    title: typeof search.title === "string" && search.title ? search.title : undefined
  }),
  component: ArtistAllPage
})

// Every album or single by an artist.
function ArtistAllPage() {
  const { browseId } = Route.useParams()
  const { params, title } = Route.useSearch()
  const router = useRouter()
  const { data, error, isPending } = useArtistGrid(browseId, params)

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
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {title && <h1 className="m-0 px-2 text-3xl font-black">{title}</h1>}
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {data.items.map((item, i) => (
              <ArtistCard key={`${i}:${item.title}`} item={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
