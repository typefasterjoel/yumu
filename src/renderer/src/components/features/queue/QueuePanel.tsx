import { useQueueStore } from "@ipc/stores/queue-store"
import { sendYtmCommand } from "@ipc/youtube/commands"
import type { QueueItem, QueueList } from "@ipc/youtube/bridge"
import ArtistLinks from "@renderer/components/features/artist/ArtistLinks"
import { Button } from "@renderer/components/ui/button"
import RemoteImage from "@renderer/components/ui/remote-image"
import { cn } from "cn"
import { XIcon } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"

function QueueRow({
  item,
  list,
  index,
  isCurrent
}: {
  item: QueueItem
  list: QueueList
  index: number
  isCurrent: boolean
}) {
  const ref = useRef<HTMLLIElement>(null)

  // Not `scrollIntoView`: it also scrolls the page behind sideways while the panel slides in.
  useEffect(() => {
    const row = ref.current
    const scroller = row?.closest<HTMLElement>("[data-queue-scroll]")
    if (!isCurrent || !row || !scroller) return
    const rowBox = row.getBoundingClientRect()
    const scrollerBox = scroller.getBoundingClientRect()
    if (rowBox.top < scrollerBox.top) scroller.scrollTop -= scrollerBox.top - rowBox.top
    else if (rowBox.bottom > scrollerBox.bottom)
      scroller.scrollTop += rowBox.bottom - scrollerBox.bottom
  }, [isCurrent])

  return (
    <li
      ref={ref}
      className={cn(
        "hover:bg-muted relative flex items-center gap-3 rounded p-2 transition-all",
        isCurrent && "bg-accent"
      )}
    >
      <button
        type="button"
        aria-label={`Play ${item.title}`}
        onClick={() => sendYtmCommand({ type: "playQueueItem", list, index })}
        className="absolute inset-0 rounded"
      />
      {item.thumbnail && (
        <RemoteImage
          src={item.thumbnail}
          alt=""
          className="pointer-events-none relative size-10 shrink-0 rounded object-cover"
        />
      )}
      <div className="pointer-events-none relative min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary")}>
          {item.title}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          <ArtistLinks
            artists={item.artists}
            className="pointer-events-auto relative z-10 hover:underline"
          />
        </p>
      </div>
      <span className="text-muted-foreground pointer-events-none relative text-xs tabular-nums">
        {item.duration}
      </span>
    </li>
  )
}

function QueueSection({
  heading,
  list,
  items,
  current
}: {
  heading?: string
  list: QueueList
  items: QueueItem[]
  current: number | null
}) {
  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-1">
      {heading && (
        <h3 className="text-muted-foreground m-0 px-2 pt-2 text-xs font-medium">{heading}</h3>
      )}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map((item, index) => (
          <QueueRow
            key={`${index}:${item.videoId}`}
            item={item}
            list={list}
            index={index}
            isCurrent={current === index}
          />
        ))}
      </ul>
    </section>
  )
}

function QueuePanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const queue = useQueueStore((s) => s.queue)
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (panelRef.current?.contains(target) || target?.closest("[data-queue-toggle]")) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose])

  const empty = !queue || (queue.items.length === 0 && queue.autoplay.length === 0)

  return (
    <div className="pointer-events-none absolute right-3 bottom-full h-[min(32rem,60vh)] w-96 overflow-hidden">
      <motion.div
        ref={panelRef}
        initial={{ y: "100%" }}
        animate={{ y: 0, transition: { type: "spring", stiffness: 260, damping: 30 } }}
        exit={{ y: "100%", transition: { duration: 0.2, ease: "easeIn" } }}
        role="dialog"
        aria-label="Queue"
        className="bg-card border-border pointer-events-auto flex size-full flex-col overflow-hidden rounded-t-xl border border-b-0"
      >
        <div className="flex items-center justify-between gap-2 p-3 pb-2">
          <div className="min-w-0">
            <h2 className="m-0 text-base font-bold">Queue</h2>
            {queue?.source && (
              <p className="text-muted-foreground m-0 truncate text-xs">
                Playing from {queue.source}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close queue" onClick={onClose}>
            <XIcon />
          </Button>
        </div>
        <div
          data-queue-scroll
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 pt-0"
        >
          {empty ? (
            <p className="text-muted-foreground p-4 text-center text-sm">Nothing is queued.</p>
          ) : (
            <>
              <QueueSection
                list="items"
                items={queue.items}
                current={queue.current?.list === "items" ? queue.current.index : null}
              />
              <QueueSection
                heading="Autoplay"
                list="autoplay"
                items={queue.autoplay}
                current={queue.current?.list === "autoplay" ? queue.current.index : null}
              />
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default QueuePanel
