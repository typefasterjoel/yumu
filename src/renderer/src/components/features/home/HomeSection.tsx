import type { HomeSection as HomeSectionData } from "@ipc/youtube/parse-home"
import ArtistSection from "@renderer/components/features/artist/ArtistSection"
import TrackRow from "@renderer/components/features/browse/TrackRow"

function HomeSection({ section }: { section: HomeSectionData }) {
  if (section.kind === "cards") return <ArtistSection section={section} />

  return (
    <section className="flex flex-col gap-2">
      <h2 className="m-0 px-2 text-xl font-bold">{section.title}</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {section.tracks.map((track, i) => (
          <TrackRow key={`${i}:${track.videoId}`} track={track} position={i + 1} />
        ))}
      </ul>
    </section>
  )
}

export default HomeSection
