import { GET_ALBUM_ART } from "@ipc/types"
import { ipcMain, net } from "electron"

const ALLOWED_HOSTS = [
  ".googleusercontent.com",
  ".ytimg.com",
  ".ggpht.com",
  "www.gstatic.com",
  "music.youtube.com"
]
const MAX_CACHED = 300
const MAX_CONCURRENT = 6

let active = 0
const waiting: (() => void)[] = []

// A page of artwork asks for hundreds of images at once, which is what gets the host to answer 429.
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (active < MAX_CONCURRENT) active++
  else await new Promise<void>((resolve) => waiting.push(resolve))

  try {
    return await task()
  } finally {
    // A waiting request takes over this slot.
    const next = waiting.shift()
    if (next) next()
    else active--
  }
}

// Keyed by URL. Holds the promise so a repeated request joins one already in flight.
const cache = new Map<string, Promise<string | null>>()

function isAllowed(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === "https:" && ALLOWED_HOSTS.some((host) => hostname.endsWith(host))
  } catch {
    return false
  }
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await net.fetch(url)
    if (!response.ok) {
      console.warn(`Album art request failed with status ${response.status}: ${url}`)
      return null
    }
    const type = response.headers.get("content-type") ?? "image/jpeg"
    const bytes = Buffer.from(await response.arrayBuffer())
    return `data:${type};base64,${bytes.toString("base64")}`
  } catch (error) {
    console.warn("Album art request failed:", error)
    return null
  }
}

/**
 * The renderer's own `<img>` request for some album art gets a 429 from Google's image host,
 * while the same URL loads fine from here. So the player asks the main process for it and
 * shows the result as a data URL.
 */
export function albumArtListeners() {
  ipcMain.handle(GET_ALBUM_ART, (_, url: string) => {
    if (typeof url !== "string" || !isAllowed(url)) return null

    let result = cache.get(url)
    if (result) {
      // Moves it to the end, so the entry dropped when the cache is full is the least recently used.
      cache.delete(url)
      cache.set(url, result)
    } else {
      result = limited(() => fetchAsDataUrl(url))
      cache.set(url, result)
      // Failures aren't kept, so a later attempt can try again.
      void result.then((value) => {
        if (value === null) cache.delete(url)
      })
      if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!)
    }
    return result
  })
}
