import { sendYtmCommand } from "@ipc/youtube/commands"
import type { SearchResult } from "@ipc/youtube/parse-search"
import ResultContent from "@renderer/components/features/search/ResultContent"
import { useSearchCommand } from "@renderer/components/features/search/use-search-command"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@renderer/components/ui/command"
import { InputGroupAddon, InputGroupButton } from "@renderer/components/ui/input-group"
import { useDebouncedValue } from "@renderer/hooks/use-debounced-value"
import { useSearch } from "@renderer/queries/search"
import { useNavigate } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

const resultKey = (result: SearchResult) =>
  `${result.kind}:${"videoId" in result ? result.videoId : result.browseId}`

const GROUPS: { kind: SearchResult["kind"]; heading: string }[] = [
  { kind: "song", heading: "Songs" },
  { kind: "artist", heading: "Artists" },
  { kind: "album", heading: "Albums" },
  { kind: "playlist", heading: "Playlists" },
  { kind: "video", heading: "Videos" },
  { kind: "episode", heading: "Episodes" }
]

function SearchCommand() {
  const open = useSearchCommand((s) => s.open)
  const setOpen = useSearchCommand((s) => s.setOpen)
  const navigate = useNavigate()
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebouncedValue(input, 300)
  const { data, isFetching, error } = useSearch(debounced)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(!useSearchCommand.getState().open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [setOpen])

  const { top, groups } = useMemo(() => {
    const shown = input.trim() ? data : undefined
    const topResult = shown?.topResult ?? null
    const rest = (shown?.results ?? []).filter(
      (result) => !topResult || resultKey(result) !== resultKey(topResult)
    )
    return {
      top: topResult,
      groups: GROUPS.map(({ kind, heading }) => ({
        heading,
        results: rest.filter((result) => result.kind === kind)
      })).filter((group) => group.results.length > 0)
    }
  }, [data, input])

  const choose = (result: SearchResult) => {
    setOpen(false)

    if ("videoId" in result) {
      sendYtmCommand({
        type: "playVideo",
        videoId: result.videoId,
        musicVideoType: result.musicVideoType
      })
    } else if (result.kind === "artist") {
      navigate({ to: "/artist/$browseId", params: { browseId: result.browseId } })
    } else {
      navigate({ to: "/browse/$browseId", params: { browseId: result.browseId } })
    }
  }

  const renderItem = (result: SearchResult) => (
    <CommandItem key={resultKey(result)} value={resultKey(result)} onSelect={() => choose(result)}>
      <ResultContent result={result} />
    </CommandItem>
  )

  const hasQuery = input.trim().length >= 2
  const searching = isFetching || debounced !== input

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search YouTube Music for songs, artists, albums and playlists."
      className="sm:max-w-xl"
    >
      {/* YouTube already ranks the results, so cmdk's own filtering is off */}
      <Command shouldFilter={false}>
        <CommandInput
          ref={inputRef}
          value={input}
          onValueChange={setInput}
          placeholder="Search YouTube Music"
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
        >
          {input && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                aria-label="Clear search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setInput("")
                  inputRef.current?.focus()
                }}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </CommandInput>
        <CommandList className="max-h-96">
          <CommandEmpty>
            {error
              ? error.message
              : !hasQuery
                ? "Type to search"
                : searching
                  ? "Searching…"
                  : "No results"}
          </CommandEmpty>
          {top && <CommandGroup heading="Top result">{renderItem(top)}</CommandGroup>}
          {groups.map(({ heading, results }) => (
            <CommandGroup key={heading} heading={heading}>
              {results.map(renderItem)}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

export default SearchCommand
