import type { ArtistSection as ArtistSectionData } from "@ipc/youtube/parse-artist"
import ArtistCard from "@renderer/components/features/artist/ArtistCard"
import Shelf from "@renderer/components/features/shelf/Shelf"
import { Link } from "@tanstack/react-router"

function SeeAllLink({ section }: { section: ArtistSectionData }) {
  const { seeAll } = section
  if (!seeAll) return null

  const className = "text-muted-foreground hover:text-foreground text-sm hover:underline"
  return seeAll.kind === "playlist" ? (
    <Link to="/browse/$browseId" params={{ browseId: seeAll.browseId }} className={className}>
      See all
    </Link>
  ) : (
    <Link
      to="/artist/$browseId/all"
      params={{ browseId: seeAll.browseId }}
      search={{ params: seeAll.params, title: section.title }}
      className={className}
    >
      See all
    </Link>
  )
}

function ArtistSection({ section }: { section: ArtistSectionData }) {
  return (
    <Shelf
      title={section.title}
      action={<SeeAllLink section={section} />}
      layoutClassName="flex gap-2"
    >
      {section.items.map((item, i) => (
        <ArtistCard key={`${i}:${item.title}`} item={item} />
      ))}
    </Shelf>
  )
}

export default ArtistSection
