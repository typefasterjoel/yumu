import { usePlayerStore } from "@ipc/stores/player-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import type { BrowseTrack } from "@ipc/youtube/parse-browse"
import ArtistLinks from "@renderer/components/features/artist/ArtistLinks"
import RemoteImage from "@renderer/components/ui/remote-image"
import { cn } from "cn"

// The track that plays is often another version of the row's video (the audio rather than the
// music video), so it can't be matched by video id. Titles also differ in suffixes like
// "(feat. …)", so only the part before the first bracket is compared.
const baseTitle = (title: string) =>
  title
    .replace(/\s*[([].*$/, "")
    .trim()
    .toLowerCase()

function TrackRow({ track, position }: { track: BrowseTrack; position: number }) {
  const isCurrent = usePlayerStore(
    (s) =>
      track.playlistId !== null &&
      s.playlistId === track.playlistId &&
      s.track !== null &&
      baseTitle(s.track.title) === baseTitle(track.title)
  )
  const { videoId } = track

  // Playing is a button stretched over the whole row, so the artist names can be real links on top
  // of it; a link can't sit inside a button.
  return (
    <li
      className={cn(
        "relative flex items-center gap-3 rounded p-3 transition-all",
        videoId ? "hover:bg-muted" : "opacity-50",
        isCurrent && "bg-accent"
      )}
    >
      <button
        type="button"
        disabled={!videoId}
        aria-label={`Play ${track.title}`}
        onClick={() =>
          videoId &&
          sendYtmCommand({
            type: "playVideo",
            videoId,
            musicVideoType: track.musicVideoType,
            playlistId: track.playlistId ?? undefined,
            index: track.index ?? undefined
          })
        }
        className="absolute inset-0 rounded"
      />
      <div className="pointer-events-none relative">
        <span className="text-accent-foreground bg-accent/95 absolute bottom-0 left-0 inline-flex size-5 shrink-0 items-center justify-center rounded-tr p-3 text-right text-xs font-semibold">
          {position}
        </span>
        {track.thumbnail && (
          <RemoteImage src={track.thumbnail} alt="" className="size-14 rounded object-cover" />
        )}
      </div>
      <div className="pointer-events-none min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary")}>
          {track.title}
        </p>
        {(track.artists.length > 0 || track.album) && (
          <p className="text-muted-foreground truncate text-xs">
            <ArtistLinks
              artists={track.artists}
              className="pointer-events-auto relative z-10 hover:underline"
            />
            {track.artists.length > 0 && track.album && " • "}
            {track.album}
          </p>
        )}
      </div>
      <span className="text-muted-foreground pointer-events-none relative text-xs tabular-nums">
        {track.duration}
      </span>
    </li>
  )
}

export default TrackRow
