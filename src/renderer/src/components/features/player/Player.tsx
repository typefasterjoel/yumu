import NowPlaying from "./NowPlaying"
import PlaybackControls from "./PlaybackControls"
import SeekBar from "./SeekBar"
import VolumeControl from "./VolumeControl"

// Bridge test layout; the real player UI replaces this.
function Player() {
  return (
    <section className="bg-card fixed inset-x-0 bottom-0 z-999 p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <NowPlaying />
        <PlaybackControls />
        <SeekBar />
        <VolumeControl />
      </div>
    </section>
  )
}

export default Player
