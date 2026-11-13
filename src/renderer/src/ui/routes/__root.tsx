import Player from "@renderer/components/features/player/Player"
import SearchCommand from "@renderer/components/features/search/SearchCommand"
import Sidebar from "@renderer/components/features/sidebar/Sidebar"
import { useHistoryShortcuts } from "@renderer/hooks/use-history-shortcuts"
import { createRootRoute, Outlet } from "@tanstack/react-router"

// App shell for the custom UI: the player stays put and the current route renders below it.
function RootLayout() {
  useHistoryShortcuts()

  return (
    <div className="bg-primary fixed inset-0 z-10 flex flex-col gap-4 pt-10">
      <Sidebar />
      <div className="bg-background relative ms-13 flex h-full overflow-hidden rounded-tl-3xl">
        <Player />
        <SearchCommand />
        {/* min-w-0 lets the page shrink to the window, so wide shelves scroll instead of stretching it. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
