import { useEffect, useState } from "react"

/**
 * Remote images go through the main process because the renderer's own request for some of them
 * gets a 429 from Google's image host. Falls back to the plain URL if that fails. Returns null
 * until the image is ready.
 */
export function useRemoteImage(url: string): string | null {
  const [loaded, setLoaded] = useState<{ url: string; src: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    window.yumu
      .getAlbumArt(url)
      .then((src) => {
        if (!cancelled) setLoaded({ url, src: src ?? url })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ url, src: url })
      })
    return () => {
      cancelled = true
    }
  }, [url])

  return loaded?.url === url ? loaded.src : null
}
