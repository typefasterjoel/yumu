import { ipcRenderer, webFrame } from "electron"
import {
  YTM_COMMAND,
  YTM_PLAYER_STATE,
  YTM_QUEUE,
  type PlayerApiState,
  type PlayerSnapshot,
  type QueueSnapshot,
  type YtmCommand
} from "@ipc/youtube/bridge"
import { installYtmMainWorld } from "./ytm-main-world"

document.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.sendToHost("youtube:preload-ready", { message: "YouTube preload script loaded" })

  let currentSinkId = ""

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

  // Two player bars exist while the new one rolls out; its buttons have no ids, so match the wrapper class.
  const clickPlayerButton = (selectors: string) => {
    const button = document.querySelector<HTMLButtonElement>(selectors)
    button?.click()
    return button !== null
  }

  const playPause = () => {
    const clicked = clickPlayerButton(
      "#play-pause-button, ytmusic-miniplayer .ytmusicPlayerControlsPlayPauseButton button"
    )
    if (!clicked) webFrame.executeJavaScript(`window.__yumuBridge?.command({ type: "toggle" })`)
  }

  const nextTrack = () => {
    clickPlayerButton(
      '.next-button, [data-id="next-button"], ytmusic-miniplayer .ytmusicPlayerControlsNextButton button'
    )
  }

  const previousTrack = () => {
    clickPlayerButton(
      '.previous-button, [data-id="previous-button"], ytmusic-miniplayer .ytmusicPlayerControlsPreviousButton button'
    )
  }

  ipcRenderer.on("media:play-pause", playPause)
  ipcRenderer.on("media:next-track", nextTrack)
  ipcRenderer.on("media:previous-track", previousTrack)

  webFrame.executeJavaScript(`(${installYtmMainWorld.toString()})()`)

  // Duration comes from the progress bar: it is set as soon as the song loads, unlike `getDuration()`.
  const readDomTrackExtras = () => {
    const byline = document.querySelector(".ytmusic-player-bar .byline, .ytmusicTrackInfoByline")
    const parts = byline?.textContent?.split("•").map((part) => part.trim())
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
    const oldArt = document.querySelector<HTMLImageElement>("#song-image #img")
    // Only a 60px thumbnail; the size is in the URL.
    const newArt = document.querySelector<HTMLImageElement>(".ytmusicTrackInfoThumbnail")
    const albumArt = oldArt?.src || newArt?.src.replace(/=w\d+-h\d+/, "=w544-h544") || ""
    const oldProgress = document.querySelector("#progress-bar")?.getAttribute("aria-valuemax")
    const newProgress = document.querySelector(".ytMusicMiniPlayerProgressBar")?.getAttribute("max")
    const duration = parseInt(oldProgress ?? newProgress ?? "", 10)
    return {
      artists,
      album: parts?.[1] ?? "",
      albumId,
      albumArt,
      ...(duration > 0 && { duration })
    }
  }

  let lastVideoId: string | null = null

  let lastQueueKey = ""
  const queueKey = (queue: QueueSnapshot) =>
    [
      queue.source,
      queue.shuffle,
      queue.repeat,
      queue.current && `${queue.current.list}:${queue.current.index}`,
      queue.items.map((item) => item.videoId).join(","),
      queue.autoplay.map((item) => item.videoId).join(",")
    ].join("|")

  const pushPlayerState = async () => {
    try {
      const state: PlayerApiState | null = await webFrame.executeJavaScript(
        "window.__yumuBridge?.getState() ?? null"
      )
      if (!state) return

      const queue: QueueSnapshot | null = await webFrame.executeJavaScript(
        "window.__yumuBridge?.getQueue() ?? null"
      )
      const playing = queue?.current ? queue[queue.current.list][queue.current.index] : undefined

      const extras = readDomTrackExtras()
      const snapshot: PlayerSnapshot = {
        ...state,
        ...extras,
        ...(playing && {
          artists: playing.artists.length ? playing.artists : extras.artists,
          album: playing.album || extras.album,
          albumId: playing.albumId ?? extras.albumId
        })
      }
      ipcRenderer.sendToHost(YTM_PLAYER_STATE, snapshot)

      if (queue) {
        const key = queueKey(queue)
        if (key !== lastQueueKey) {
          lastQueueKey = key
          ipcRenderer.sendToHost(YTM_QUEUE, queue)
        }
      }

      if (state.videoId !== lastVideoId) {
        lastVideoId = state.videoId
        // The DOM trails the player API at a track change, so send again once it settles.
        setTimeout(pushPlayerState, 1000)
      }
    } catch (error) {
      console.error("Failed to push player state:", error)
    }
  }

  // Media events don't bubble; capturing them on the document also covers videos created later.
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

  setInterval(() => {
    if (document.querySelector("video")?.paused === false) pushPlayerState()
  }, 1000)

  ipcRenderer.on(YTM_COMMAND, async (_, command: YtmCommand) => {
    try {
      switch (command.type) {
        // `movie_player.nextVideo()` bypasses the queue, so next and previous click the buttons.
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
