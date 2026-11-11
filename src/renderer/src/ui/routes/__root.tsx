import Player from "@renderer/components/features/player/Player"
import { useHistoryShortcuts } from "@renderer/hooks/use-history-shortcuts"
import { createRootRoute, Outlet } from "@tanstack/react-router"

// App shell for the custom UI: the player stays put and the current route renders below it.
function RootLayout() {
  useHistoryShortcuts()

  return (
    <div className="bg-background fixed inset-0 z-10 flex flex-col gap-4 pt-10">
      <Player />
      <div className="flex h-full">
        <aside className="border-border w-60 shrink-0 grow-0 border-r">Sidebar</aside>
        <Outlet />
      </div>
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
