import { sendYtmCommand } from "@ipc/youtube/commands"
import type { SearchResult } from "@ipc/youtube/parse-search"
import { useDebouncedValue } from "@renderer/hooks/use-debounced-value"
import { useSearch } from "@renderer/queries/search"
import { useState } from "react"

function ResultRow({ result }: { result: SearchResult }) {
  // Only tracks are playable for now; albums, playlists and artists need their own pages.
  const play =
    "videoId" in result
      ? () =>
          sendYtmCommand({
            type: "playVideo",
            videoId: result.videoId,
            musicVideoType: result.musicVideoType
          })
      : undefined

  return (
    <li>
      <button
        type="button"
        onClick={play}
        disabled={!play}
        className="enabled:hover:bg-muted flex w-full items-center gap-3 rounded p-1 text-left"
      >
        {result.thumbnail && (
          <img
            src={result.thumbnail}
            alt=""
            className={`size-10 object-cover ${result.kind === "artist" ? "rounded-full" : "rounded"}`}
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{result.title}</p>
          <p className="text-muted-foreground truncate text-xs">
            {result.kind}
            {result.subtitle && ` • ${result.subtitle}`}
          </p>
        </div>
      </button>
    </li>
  )
}

// Search test UI; the real UI replaces this.
function SearchPanel() {
  const [input, setInput] = useState("")
  const query = useDebouncedValue(input, 300)
  const { data, isFetching, error } = useSearch(query)

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
export default SearchPanel
