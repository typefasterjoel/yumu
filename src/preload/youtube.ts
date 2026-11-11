import { ipcRenderer, webFrame } from "electron"
import {
  YTM_COMMAND,
  YTM_PLAYER_STATE,
  type PlayerApiState,
  type PlayerSnapshot,
  type YtmCommand
} from "@ipc/youtube/bridge"
import { installYtmMainWorld } from "./ytm-main-world"

document.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.sendToHost("youtube:preload-ready", { message: "YouTube preload script loaded" })

  let currentSinkId = ""

  // Get Audio Devices
  const getAudioDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices
        .filter((device) => device.kind === "audiooutput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || "Unknown Device"
        }))
      ipcRenderer.sendToHost("youtube:audio", audioDevices)
    } catch (error) {
      console.error("Failed to get audio devices:", error)
    }
  }
  getAudioDevices()

  // Listen for audio device changes
  ipcRenderer.on("audio:set-device", async (_, deviceId) => {
    currentSinkId = deviceId
    console.log(`Setting audio output device to: ${deviceId}`)
    const audioElement = document.querySelector("video")
    if (audioElement) {
      try {
        await audioElement.setSinkId(deviceId)
      } catch (error) {
        console.error(`Failed to set audio output device: ${error}`)
      }
    } else {
      console.warn("No audio element found — MutationObserver will apply when element appears.")
    }
  })

  // Re-apply the stored sinkId to a video element when it is inserted or recreated
  const applyStoredSinkId = async (videoEl: HTMLVideoElement) => {
    if (!currentSinkId) return
    if (videoEl.sinkId === currentSinkId) return
    try {
      await videoEl.setSinkId(currentSinkId)
      console.log(`Re-applied sinkId to new video element`)
    } catch (error) {
      console.error(`Failed to re-apply sinkId: ${error}`)
    }
  }

  const videoObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLVideoElement) {
          applyStoredSinkId(node)
        } else if (node instanceof Element) {
          node.querySelectorAll("video").forEach((v) => applyStoredSinkId(v as HTMLVideoElement))
        }
      }
    }
  })

  videoObserver.observe(document.body, { childList: true, subtree: true })

  navigator.mediaDevices.addEventListener("devicechange", () => {
    getAudioDevices()
  })

  // Media control functions
  const playPause = () => {
    const playButton = document.getElementById("play-pause-button") as HTMLButtonElement
    if (playButton) {
      playButton.click()
    }
  }

  const nextTrack = () => {
    const nextButton = document.querySelector(
      '.next-button, [data-id="next-button"]'
    ) as HTMLButtonElement
    if (nextButton) {
      nextButton.click()
    }
  }

  const previousTrack = () => {
    const prevButton = document.querySelector(
      '.previous-button, [data-id="previous-button"]'
    ) as HTMLButtonElement
    if (prevButton) {
      prevButton.click()
    }
  }

  // Listen for media key events from main process
  ipcRenderer.on("media:play-pause", playPause)
  ipcRenderer.on("media:next-track", nextTrack)
  ipcRenderer.on("media:previous-track", previousTrack)

  // Yumu bridge: player state out to the custom UI, commands in.
  webFrame.executeJavaScript(`(${installYtmMainWorld.toString()})()`)

  // Album, art and the artists' pages only exist in the DOM, not in the player API. The song's
  // length is read from the progress bar too: YouTube Music sets `aria-valuemax` to it in seconds
  // as soon as the song loads, which is more reliable than `getDuration()`.
  const readDomTrackExtras = () => {
    const byline = document.querySelector(".ytmusic-player-bar .byline")
    const parts = byline?.textContent?.split("•").map((part) => part.trim())
    // The player bar links each artist to their channel, e.g. href="channel/UC…", and the album to
    // its page, e.g. href="browse/MPREb_…". Anything it doesn't link (a name with no page) is
    // skipped here.
    const links = [...(byline?.querySelectorAll("a") ?? [])]
    const artists = links.flatMap((link) => {
      const browseId = link.getAttribute("href")?.match(/(?:^|\/)channel\/(UC[\w-]+)/)?.[1]
      const name = link.textContent?.trim()
      return browseId && name ? [{ name, browseId }] : []
    })
    const albumId =
      links
        .map((link) => link.getAttribute("href")?.match(/(?:^|\/)browse\/(MPREb_[\w-]+)/)?.[1])
        .find(Boolean) ?? null
    const art = document.querySelector("#song-image #img") as HTMLImageElement | null
    const progressBar = document.querySelector("#progress-bar")
    const duration = parseInt(progressBar?.getAttribute("aria-valuemax") ?? "", 10)
    return {
      artists,
      album: parts?.[1] ?? "",
      albumId,
      albumArt: art?.src ?? "",
      ...(duration > 0 && { duration })
    }
  }

  let lastVideoId: string | null = null

  const pushPlayerState = async () => {
    try {
      const state: PlayerApiState | null = await webFrame.executeJavaScript(
        "window.__yumuBridge?.getState() ?? null"
      )
      if (!state) return

      const snapshot: PlayerSnapshot = { ...state, ...readDomTrackExtras() }
      ipcRenderer.sendToHost(YTM_PLAYER_STATE, snapshot)

      if (state.videoId !== lastVideoId) {
        lastVideoId = state.videoId
        // The DOM metadata trails the player API at a track change; send again once it settles.
        setTimeout(pushPlayerState, 1000)
      }
    } catch (error) {
      console.error("Failed to push player state:", error)
    }
  }

  // Media events don't bubble, but they can be captured on the document, which also covers
  // video elements YouTube Music creates later.
  const PLAYER_EVENTS = [
    "play",
    "playing",
    "pause",
    "waiting",
    "seeked",
    "loadedmetadata",
    "durationchange",
    "volumechange",
    "ended"
  ]
  for (const eventName of PLAYER_EVENTS) {
    document.addEventListener(
      eventName,
      (event) => {
        if (event.target instanceof HTMLVideoElement) pushPlayerState()
      },
      true
    )
  }

  // Position only needs a steady tick while something is playing.
  setInterval(() => {
    if (document.querySelector("video")?.paused === false) pushPlayerState()
  }, 1000)

  ipcRenderer.on(YTM_COMMAND, async (_, command: YtmCommand) => {
    try {
      switch (command.type) {
        // YouTube Music's own queue is driven by its buttons, not `movie_player.nextVideo()`.
        case "next":
          nextTrack()
          break
        case "previous":
          previousTrack()
          break
        default:
          await webFrame.executeJavaScript(
            `window.__yumuBridge?.command(${JSON.stringify(command)})`
          )
      }
    } catch (error) {
      console.error("Failed to run YouTube Music command:", error)
    }
  })
})
