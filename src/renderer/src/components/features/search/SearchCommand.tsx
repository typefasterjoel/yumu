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
import { useLibraryItems } from "@renderer/queries/library"
import { useSearch } from "@renderer/queries/search"
import { useNavigate } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

const resultKey = (result: SearchResult) =>
  `${result.kind}:${"videoId" in result ? result.videoId : result.browseId}`

const MAX_LIBRARY_RESULTS = 5

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

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
  const { data: library } = useLibraryItems(open)

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

  const { top, groups, mine } = useMemo(() => {
    const shown = input.trim() ? data : undefined
    const topResult = shown?.topResult ?? null

    const words = normalize(input).split(/\s+/).filter(Boolean)
    const matches = words.length
      ? (library ?? []).filter((item) => {
          const text = normalize(`${item.title} ${item.subtitle}`)
          return words.every((word) => text.includes(word))
        })
      : []
    const titleStarts = (item: SearchResult) => normalize(item.title).startsWith(words[0] ?? "")
    const mineResults = [
      ...matches.filter(titleStarts),
      ...matches.filter((m) => !titleStarts(m))
    ].slice(0, MAX_LIBRARY_RESULTS)
    const mineKeys = new Set(mineResults.map(resultKey))

    const rest = (shown?.results ?? []).filter(
      (result) =>
        (!topResult || resultKey(result) !== resultKey(topResult)) &&
        !mineKeys.has(resultKey(result))
    )
    return {
      mine: mineResults,
      top: topResult,
      groups: GROUPS.map(({ kind, heading }) => ({
        heading,
        results: rest.filter((result) => result.kind === kind)
      })).filter((group) => group.results.length > 0)
    }
  }, [data, input, library])

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

  const renderItem = (result: SearchResult, prefix = "") => (
    <CommandItem
      key={prefix + resultKey(result)}
      value={prefix + resultKey(result)}
      onSelect={() => choose(result)}
    >
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
          {mine.length > 0 && (
            <CommandGroup heading="Your library">
              {mine.map((result) => renderItem(result, "library:"))}
            </CommandGroup>
          )}
          {top && <CommandGroup heading="Top result">{renderItem(top)}</CommandGroup>}
          {groups.map(({ heading, results }) => (
            <CommandGroup key={heading} heading={heading}>
              {results.map((result) => renderItem(result))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

export default SearchCommand
