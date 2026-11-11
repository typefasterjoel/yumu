import { sendYtmCommand } from "@ipc/youtube/commands"
import type { SearchResult } from "@ipc/youtube/parse-search"
import ResultContent from "@renderer/components/features/search/ResultContent"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor
} from "@renderer/components/ui/combobox"
import { InputGroupAddon, InputGroupButton } from "@renderer/components/ui/input-group"
import { useDebouncedValue } from "@renderer/hooks/use-debounced-value"
import { useSearch } from "@renderer/queries/search"
import { createFileRoute } from "@tanstack/react-router"
import { SearchIcon, XIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

export const Route = createFileRoute("/search/")({
  // The query lives in the URL so going back from an album restores the search.
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined
  }),
  component: SearchPage
})

const resultKey = (result: SearchResult) =>
  `${result.kind}:${"videoId" in result ? result.videoId : result.browseId}`

// Search test UI; the real UI replaces this.
function SearchPage() {
  const { q = "" } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [input, setInput] = useState(q)
  const debounced = useDebouncedValue(input, 300)
  const { data, isFetching, error } = useSearch(q)
  const anchor = useComboboxAnchor()

  // `replace` keeps each keystroke from becoming its own history entry.
  useEffect(() => {
    if (debounced !== q) navigate({ search: { q: debounced || undefined }, replace: true })
  }, [debounced, q, navigate])

  const items = useMemo(
    () => (data ? [...(data.topResult ? [data.topResult] : []), ...data.results] : []),
    [data]
  )

  const choose = (result: SearchResult | null) => {
    if (!result) return

    if ("videoId" in result) {
      sendYtmCommand({
        type: "playVideo",
        videoId: result.videoId,
        musicVideoType: result.musicVideoType
      })
    } else if (result.kind === "album" || result.kind === "playlist") {
      navigate({ to: "/browse/$browseId", params: { browseId: result.browseId } })
    } else {
      navigate({ to: "/artist/$browseId", params: { browseId: result.browseId } })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="p-4">
        <Combobox
          items={items}
          filter={null}
          value={null}
          onValueChange={choose}
          inputValue={input}
          onInputValueChange={(value, details) => {
            if (details.reason !== "item-press") setInput(value)
          }}
          itemToStringLabel={(result: SearchResult) => result.title}
        >
          {/* The popup anchors to the input element by default, which is narrower than the
              group once the addons take their space. Anchoring to this wrapper makes it match
              the whole field. */}
          <div ref={anchor}>
            <ComboboxInput placeholder="Search YouTube Music" showTrigger={false}>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              {input && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Clear search"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setInput("")}
                  >
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </ComboboxInput>
          </div>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>{isFetching ? "Searching…" : "No results"}</ComboboxEmpty>
            <ComboboxList>
              {(result: SearchResult) => (
                <ComboboxItem
                  key={resultKey(result)}
                  value={result}
                  className="transition-all not-first:mt-1"
                >
                  <ResultContent result={result} />
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {error && <p className="text-destructive text-sm">{error.message}</p>}
    </div>
  )
}
