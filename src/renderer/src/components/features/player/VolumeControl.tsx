import { usePlayerStore } from "@ipc/stores/player-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import { Button } from "@renderer/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@renderer/components/ui/popover"
import { Slider } from "@renderer/components/ui/slider"
import { Volume1Icon, Volume2Icon, VolumeIcon, VolumeXIcon } from "lucide-react"

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button aria-label="Volume" size="icon" variant="outline">
            {volume == 0 && <VolumeXIcon />}
            {volume > 0 && volume < 40 && <VolumeIcon />}
            {volume >= 40 && volume < 75 && <Volume1Icon />}
            {volume >= 75 && <Volume2Icon />}
          </Button>
        }
      />
      <PopoverContent className="w-auto" side="top">
        <label className="flex items-center gap-2 text-sm">
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) =>
              sendYtmCommand({ type: "setVolume", volume: value as number })
            }
            orientation="vertical"
          />

          {/*<input
             aria-orientation="vertical"
             type="range"
             className="w-1 [appearance:slider-vertical] align-bottom [direction:rtl] [writing-mode:vertical-lr]"
             min={0}
             max={100}
             value={volume}
             onChange={(e) => sendYtmCommand({ type: "setVolume", volume: Number(e.target.value) })}
           />*/}
        </label>
      </PopoverContent>
    </Popover>
  )
}

export default VolumeControl
