import { usePlayerStore } from "@ipc/stores/player-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import { Button } from "@renderer/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@renderer/components/ui/popover"
import { VolumeIcon } from "lucide-react"

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button aria-label="Volume" size="icon" variant="outline">
            <VolumeIcon />
          </Button>
        }
      />
      <PopoverContent className="w-auto" side="top">
        <label className="flex items-center gap-2 text-sm">
          <input
            aria-orientation="vertical"
            type="range"
            className="w-1 [appearance:slider-vertical] align-bottom [direction:rtl] [writing-mode:vertical-lr]"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => sendYtmCommand({ type: "setVolume", volume: Number(e.target.value) })}
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}

export default VolumeControl
