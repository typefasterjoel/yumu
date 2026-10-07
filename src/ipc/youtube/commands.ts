import { YTM_COMMAND, type InnertubeEndpoint, type YtmCommand } from "@ipc/youtube/bridge"

// The webview lives inside `YouTubeView`; this lets the rest of the renderer reach it.
let target: Electron.WebviewTag | null = null

export function setCommandTarget(webview: Electron.WebviewTag | null) {
  target = webview
}

/** Calls an Innertube endpoint from inside the YouTube Music page and returns the raw JSON. */
export async function requestInnertube<T = unknown>(
  endpoint: InnertubeEndpoint,
  body: Record<string, unknown>
): Promise<T> {
  if (!target) throw new Error("YouTube Music is not loaded yet")

  // Only fixed strings and JSON-encoded values are interpolated into the script.
  return target.executeJavaScript(
    `window.__yumuBridge.request(${JSON.stringify(endpoint)}, ${JSON.stringify(body)})`
  )
}

export function sendYtmCommand(command: YtmCommand) {
  try {
    target?.send(YTM_COMMAND, command)
  } catch (error) {
    // `send` throws until the webview has finished loading.
    console.warn("YouTube Music command dropped:", command.type, error)
  }
}
