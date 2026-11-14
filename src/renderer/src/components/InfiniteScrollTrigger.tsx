import { useEffect, useRef } from "react"

type Props = {
  hasNextPage: boolean
  isFetching: boolean
  onLoadMore: () => void
}

function InfiniteScrollTrigger({ hasNextPage, isFetching, onLoadMore }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Re-observing after each fetch also covers a page that is still too short to scroll.
  useEffect(() => {
    const element = ref.current
    if (!element || !hasNextPage || isFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore()
      },
      { rootMargin: "400px" }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasNextPage, isFetching, onLoadMore])

  if (!hasNextPage) return null

  return (
    <div ref={ref} className="text-muted-foreground self-center py-4 text-sm">
      {isFetching ? "Loading…" : ""}
    </div>
  )
}

export default InfiniteScrollTrigger
