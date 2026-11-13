import QueuePanel from "@renderer/components/features/queue/QueuePanel"
import { Button } from "@renderer/components/ui/button"
import { ListMusicIcon } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { useCallback, useState } from "react"
import NowPlaying from "./NowPlaying"
import PlaybackControls from "./PlaybackControls"
import SeekBar from "./SeekBar"
import VolumeControl from "./VolumeControl"

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
        <VolumeControl />
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
      </div>
    </section>
  )
}

export default Player
