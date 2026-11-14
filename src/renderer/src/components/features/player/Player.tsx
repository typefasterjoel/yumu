import QueuePanel from "@renderer/components/features/queue/QueuePanel"
import { Button } from "@renderer/components/ui/button"
import { ListMusicIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { useCallback, useState } from "react"
import NowPlaying from "./NowPlaying"
import PlaybackControls from "./PlaybackControls"
import SeekBar from "./SeekBar"
import VolumeControl from "./VolumeControl"
import { ButtonGroup } from "@renderer/components/ui/button-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip"

function Player() {
  const [queueOpen, setQueueOpen] = useState(false)
  const closeQueue = useCallback(() => setQueueOpen(false), [])

  return (
    <section className="bg-card absolute inset-x-0 bottom-0 z-999 p-3 shadow-lg">
      <AnimatePresence>{queueOpen && <QueuePanel onClose={closeQueue} />}</AnimatePresence>
      <div className="flex items-center gap-2 pt-2">
        <NowPlaying />
        <SeekBar />
        <PlaybackControls />
        <ButtonGroup>
          <VolumeControl />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Queue"
                  data-queue-toggle
                  aria-pressed={queueOpen}
                  size="icon"
                  variant="outline"
                  className="aria-pressed:bg-accent"
                  onClick={() => setQueueOpen((open) => !open)}
                >
                  <ListMusicIcon />
                </Button>
              }
            />
            <TooltipContent>Song Queue</TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </div>
    </section>
  )
}

export default Player
