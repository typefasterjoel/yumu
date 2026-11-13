import { sendYtmCommand } from "@ipc/youtube/commands"
import type { ArtistItem } from "@ipc/youtube/parse-artist"
import RemoteImage from "@renderer/components/ui/remote-image"
import { useNavigate } from "@tanstack/react-router"
import { cn } from "cn"

function ArtistCard({ item }: { item: ArtistItem }) {
  const navigate = useNavigate()

  const open = () => {
    if (item.kind === "video") {
      sendYtmCommand({
        type: "playVideo",
        videoId: item.videoId,
        musicVideoType: item.musicVideoType
      })
    } else if (item.kind === "artist") {
      navigate({ to: "/artist/$browseId", params: { browseId: item.browseId } })
    } else {
      navigate({ to: "/browse/$browseId", params: { browseId: item.browseId } })
    }
  }

  return (
    <li className="w-40 shrink-0">
      <button
        type="button"
        onClick={open}
        className="hover:bg-muted flex w-full flex-col gap-2 rounded p-2 text-left transition-all"
      >
        {item.thumbnail &&
          (item.kind === "video" ? (
            <div className="border-primary/60 relative aspect-square w-full overflow-hidden rounded-full border-3 shadow-md">
              <div className="bg-background border-primary/60 absolute top-1/2 left-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" />
              <RemoteImage src={item.thumbnail} alt="" className="size-full object-cover" />
            </div>
          ) : (
            <RemoteImage
              src={item.thumbnail}
              alt=""
              className={cn(
                "aspect-square w-full object-cover",
                item.kind === "artist" ? "rounded-3xl" : "rounded"
              )}
            />
          ))}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="text-muted-foreground truncate text-xs">{item.subtitle}</p>
        </div>
      </button>
    </li>
  )
}

export default ArtistCard
