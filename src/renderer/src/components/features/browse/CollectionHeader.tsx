import { sendYtmCommand } from "@ipc/youtube/commands"
import type { BrowseHeader } from "@ipc/youtube/parse-browse"
import { Button } from "@renderer/components/ui/button"
import { PlayIcon, ShuffleIcon } from "lucide-react"
import RemoteImage from "@renderer/components/ui/remote-image"

function CollectionHeader({ header }: { header: BrowseHeader }) {
  const { playlistId, shuffle } = header

  return (
    <header className="relative flex max-w-1/2 shrink-0 grow-0 flex-col items-start gap-4">
      {header.thumbnail && (
        <RemoteImage
          src={header.thumbnail}
          alt=""
          className="aspect-square w-full object-cover opacity-75"
        />
      )}
      <div className="from-background absolute inset-0 flex min-w-0 flex-col justify-end gap-2 bg-linear-to-t from-15% to-transparent px-6 pb-14">
        <p className="text-muted-foreground m-0 truncate text-xs">
          {[header.author, header.subtitle].filter(Boolean).join(" • ")}
        </p>
        <h1 className="m-0 text-5xl font-black tracking-normal text-pretty">{header.title}</h1>
        <p className="text-muted-foreground m-0 text-xs">{header.stats}</p>
        <div className="flex gap-2">
          <Button
            disabled={!playlistId}
            size="lg"
            onClick={() => playlistId && sendYtmCommand({ type: "playPlaylist", playlistId })}
          >
            <PlayIcon /> Play
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            disabled={!shuffle}
            onClick={() =>
              shuffle &&
              sendYtmCommand({
                type: "playPlaylist",
                playlistId: shuffle.playlistId,
                params: shuffle.params
              })
            }
          >
            <ShuffleIcon />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default CollectionHeader
