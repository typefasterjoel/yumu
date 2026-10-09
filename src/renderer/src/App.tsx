import { useUiStore } from "@ipc/stores/ui-store"
import { startDiscordSync } from "@ipc/youtube/discord-sync"
import ApplicationToolbar from "@renderer/components/ApplicationToolbar"
import PermissionsDialog from "@renderer/components/PermissionsDialog"
import YouTubeView from "@renderer/components/YouTubeView"
import { router } from "@renderer/ui/router"
import { RouterProvider } from "@tanstack/react-router"
import { useEffect } from "react"

function App(): React.JSX.Element {
  const customUiEnabled = useUiStore((s) => s.customUiEnabled)

  useEffect(() => startDiscordSync(), [])

  return (
    <main className="bg-primary relative z-0 h-screen w-screen overflow-hidden pt-10">
      <ApplicationToolbar />
      <div className="bg-primary relative flex h-full w-full items-center justify-center">
        {customUiEnabled && <RouterProvider router={router} />}
        <YouTubeView />
        <PermissionsDialog />
      </div>
    </main>
  )
}

export default App
