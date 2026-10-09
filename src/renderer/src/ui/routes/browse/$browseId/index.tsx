import { createFileRoute, useRouter } from "@tanstack/react-router"

export const Route = createFileRoute("/browse/$browseId/")({
  component: BrowsePage
})

// Album and playlist page; the track list comes with the playlist work.
function BrowsePage() {
  const { browseId } = Route.useParams()
  const router = useRouter()

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="w-fit text-sm underline"
        onClick={() => router.history.back()}
      >
        Back
      </button>
      <p className="text-muted-foreground text-sm">{browseId}</p>
    </div>
  )
}
