import { sendYtmCommand } from "@ipc/youtube/commands"
import type { SearchResult } from "@ipc/youtube/parse-search"
import { Link } from "@tanstack/react-router"

const rowClass = "enabled:hover:bg-muted flex w-full items-center gap-3 rounded p-1 text-left"

function Content({ result }: { result: SearchResult }) {
  return (
    <>
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
    </>
  )
}

function ResultRow({ result }: { result: SearchResult }) {
  if ("videoId" in result) {
    return (
      <li>
        <button
          type="button"
          className={rowClass}
          onClick={() =>
            sendYtmCommand({
              type: "playVideo",
              videoId: result.videoId,
              musicVideoType: result.musicVideoType
            })
          }
        >
          <Content result={result} />
        </button>
      </li>
    )
  }

  if (result.kind === "album" || result.kind === "playlist") {
    return (
      <li>
        <Link to="/browse/$browseId" params={{ browseId: result.browseId }} className={rowClass}>
          <Content result={result} />
        </Link>
      </li>
    )
  }

  // Artist pages don't exist yet.
  return (
    <li>
      <button type="button" disabled className={rowClass}>
        <Content result={result} />
      </button>
    </li>
  )
}

export default ResultRow
