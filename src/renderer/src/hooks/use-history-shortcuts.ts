import { useRouter } from "@tanstack/react-router"
import { useEffect } from "react"

// Memory history isn't wired to the browser's own back/forward, so the mouse side buttons and
// Alt+Arrow shortcuts have to be forwarded to the router.
export function useHistoryShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 3) router.history.back()
      else if (e.button === 4) router.history.forward()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return
      if (e.key === "ArrowLeft") router.history.back()
      else if (e.key === "ArrowRight") router.history.forward()
    }

    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [router])
}
