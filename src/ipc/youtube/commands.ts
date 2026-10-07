import { YTM_COMMAND, type YtmCommand } from "@ipc/youtube/bridge"

// The webview lives inside `YouTubeView`; this lets the rest of the renderer reach it.
let target: Electron.WebviewTag | null = null

export function setCommandTarget(webview: Electron.WebviewTag | null) {
  target = webview
}

export function sendYtmCommand(command: YtmCommand) {
  try {
    target?.send(YTM_COMMAND, command)
  } catch (error) {
    // `send` throws until the webview has finished loading.
    console.warn("YouTube Music command dropped:", command.type, error)
  }
}
