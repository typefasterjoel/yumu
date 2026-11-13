import type { HomeSection as HomeSectionData } from "@ipc/youtube/parse-home"
import ArtistSection from "@renderer/components/features/artist/ArtistSection"
import TrackRow from "@renderer/components/features/browse/TrackRow"
import Shelf from "@renderer/components/features/shelf/Shelf"

function HomeSection({ section }: { section: HomeSectionData }) {
  if (section.kind === "cards") return <ArtistSection section={section} />

  return (
    <Shelf
      title={section.title}
      layoutClassName="grid grid-flow-col auto-cols-[min(24rem,85%)] gap-x-2 gap-y-1"
      layoutStyle={{ gridTemplateRows: `repeat(${section.rowsPerColumn}, auto)` }}
    >
      {section.tracks.map((track, i) => (
        <TrackRow key={`${i}:${track.videoId}`} track={track} />
      ))}
    </Shelf>
  )
}

export default HomeSection
