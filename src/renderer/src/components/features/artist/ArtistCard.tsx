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
        {item.thumbnail && (
          <RemoteImage
            src={item.thumbnail}
            alt=""
            className={cn(
              "w-full object-cover",
              item.kind === "video" ? "aspect-video" : "aspect-square",
              item.kind === "artist" ? "rounded-full" : "rounded"
            )}
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="text-muted-foreground truncate text-xs">{item.subtitle}</p>
        </div>
      </button>
    </li>
  )
}

export default ArtistCard
