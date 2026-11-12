import type { ArtistSection as ArtistSectionData } from "@ipc/youtube/parse-artist"
import ArtistCard from "@renderer/components/features/artist/ArtistCard"
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
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-2">
        <h2 className="m-0 text-xl font-bold">{section.title}</h2>
        <SeeAllLink section={section} />
      </div>
      <ul className="m-0 flex [scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent] list-none gap-2 overflow-x-auto p-0 pb-2 [color-scheme:dark]">
        {section.items.map((item, i) => (
          <ArtistCard key={`${i}:${item.title}`} item={item} />
        ))}
      </ul>
    </section>
  )
}

export default ArtistSection
