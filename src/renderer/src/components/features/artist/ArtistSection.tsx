import type { ArtistSection as ArtistSectionData } from "@ipc/youtube/parse-artist"
import ArtistCard from "@renderer/components/features/artist/ArtistCard"
import { Button } from "@renderer/components/ui/button"
import { Link } from "@tanstack/react-router"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const SCROLL_STEP = 0.8

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

function useScrollEdges() {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ canScroll: false, atStart: true, atEnd: true })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const next = {
      canScroll: el.scrollWidth > el.clientWidth + 1,
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
    }
    setEdges((prev) =>
      prev.canScroll === next.canScroll &&
      prev.atStart === next.atStart &&
      prev.atEnd === next.atEnd
        ? prev
        : next
    )
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    return () => observer.disconnect()
  }, [update])

  const scrollBy = (direction: -1 | 1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * SCROLL_STEP, behavior: "smooth" })
  }

  return { ref, update, scrollBy, ...edges }
}

function ArtistSection({ section }: { section: ArtistSectionData }) {
  const { ref, update, scrollBy, canScroll, atStart, atEnd } = useScrollEdges()

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 px-2">
        <h2 className="m-0 text-xl font-bold">{section.title}</h2>
        <div className="flex items-center gap-3">
          <SeeAllLink section={section} />
          <div className={cn("flex gap-1", !canScroll && "invisible")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Scroll left"
              disabled={atStart}
              onClick={() => scrollBy(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Scroll right"
              disabled={atEnd}
              onClick={() => scrollBy(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </div>
      <ul ref={ref} onScroll={update} className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-2">
        {section.items.map((item, i) => (
          <ArtistCard key={`${i}:${item.title}`} item={item} />
        ))}
      </ul>
    </section>
  )
}

export default ArtistSection
