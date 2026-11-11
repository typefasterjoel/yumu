// The Innertube responses are deeply nested and change without notice, so everything is read
// defensively: anything that isn't the expected shape is skipped rather than thrown on.
export type Json = unknown

export const at = (value: Json, ...path: (string | number)[]): Json =>
  path.reduce<Json>(
    (current, key) =>
      current && typeof current === "object" ? (current as Record<string, Json>)[key] : undefined,
    value
  )

export const str = (value: Json): string | undefined =>
  typeof value === "string" ? value : undefined
export const list = (value: Json): Json[] => (Array.isArray(value) ? value : [])
export const runTexts = (runs: Json): string[] =>
  list(runs).map((run) => str(at(run, "text")) ?? "")

/** Drops the leading type label ("Song", "Album", …) and the separator after it. */
export const subtitleFromRuns = (runs: Json): string => {
  const texts = runTexts(runs)
  return texts
    .slice(texts[1]?.trim() === "•" ? 2 : 1)
    .join("")
    .trim()
}

export const thumbnailFrom = (thumbnails: Json): string => {
  // Sorted smallest to largest.
  const largest = list(thumbnails).at(-1)
  return str(at(largest, "url")) ?? ""
}
