import ResultRow from "@renderer/components/features/search/ResultRow"
import { useDebouncedValue } from "@renderer/hooks/use-debounced-value"
import { useSearch } from "@renderer/queries/search"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/search/")({
  // The query lives in the URL so going back from an album restores the search.
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined
  }),
  component: SearchPage
})

// Search test UI; the real UI replaces this.
function SearchPage() {
  const { q = "" } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [input, setInput] = useState(q)
  const debounced = useDebouncedValue(input, 300)
  const { data, isFetching, error } = useSearch(q)

  // `replace` keeps each keystroke from becoming its own history entry.
  useEffect(() => {
    if (debounced !== q) navigate({ search: { q: debounced || undefined }, replace: true })
  }, [debounced, q, navigate])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <input
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search YouTube Music"
        className="bg-background rounded-md border px-3 py-2 text-sm"
      />
      {error && <p className="text-destructive text-sm">{error.message}</p>}
      {isFetching && <p className="text-muted-foreground text-xs">Searching…</p>}
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {data?.topResult && <ResultRow result={data.topResult} />}
        {data?.results.map((result) => (
          <ResultRow
            key={`${result.kind}:${"videoId" in result ? result.videoId : result.browseId}`}
            result={result}
          />
        ))}
      </ul>
    </div>
  )
}
