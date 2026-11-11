import { sendYtmCommand } from "@ipc/youtube/commands"
import type { ArtistHeader as ArtistHeaderData } from "@ipc/youtube/parse-artist"
import { Button } from "@renderer/components/ui/button"
import { RadioIcon, ShuffleIcon } from "lucide-react"
import RemoteImage from "@renderer/components/ui/remote-image"

function ArtistHeader({ header }: { header: ArtistHeaderData }) {
  const { shuffle, radio } = header

  return (
    <header className="relative shrink-0">
      {header.thumbnail && (
        <RemoteImage
          src={header.thumbnail}
          alt=""
          className="h-72 w-full object-cover opacity-75"
        />
      )}
      <div className="from-background absolute inset-0 flex min-w-0 flex-col justify-end gap-2 bg-linear-to-t from-15% to-transparent px-6 pb-6">
        <h1 className="m-0 text-5xl font-black tracking-normal text-pretty">{header.name}</h1>
        <p className="text-muted-foreground m-0 text-xs">
          {[header.monthlyListeners, header.subscribers && `${header.subscribers} subscribers`]
            .filter(Boolean)
            .join(" • ")}
        </p>
        <div className="flex gap-2">
          <Button
            size="lg"
            disabled={!shuffle}
            onClick={() => shuffle && sendYtmCommand({ type: "playPlaylist", ...shuffle })}
          >
            <ShuffleIcon /> Shuffle
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={!radio}
            onClick={() => radio && sendYtmCommand({ type: "playPlaylist", ...radio })}
          >
            <RadioIcon /> Radio
          </Button>
        </div>
      </div>
    </header>
  )
}

export default ArtistHeader
