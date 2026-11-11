import type { SearchResult } from "@ipc/youtube/parse-search"
import RemoteImage from "@renderer/components/ui/remote-image"

function ResultContent({ result }: { result: SearchResult }) {
  return (
    <>
      {result.thumbnail && (
        <RemoteImage
          src={result.thumbnail}
          alt=""
          className={`size-10 object-cover ${result.kind === "artist" ? "rounded-full" : "rounded"}`}
        />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{result.title}</p>
        <p className="text-muted-foreground truncate text-xs capitalize">
          {result.kind}
          {result.subtitle && ` • ${result.subtitle}`}
        </p>
      </div>
    </>
  )
}

export default ResultContent
