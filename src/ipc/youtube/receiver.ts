import { type AudioDevice } from "@ipc/types"
import { usePlayerStore } from "@ipc/stores/player-store"
import { YTM_PLAYER_STATE, type PlayerSnapshot } from "@ipc/youtube/bridge"

export async function receiveYouTubeEvents(event: Electron.IpcMessageEvent) {
  const { channel, args } = event

  switch (channel) {
    case "youtube:audio": {
      const audioDevices = args[0] as AudioDevice[]
      // console.log('Received audio devices:', audioDevices)
      window.yumu.preloadAudioDevices(audioDevices)
      break
    }

    case "youtube:preload-ready": {
      // const preloadData = args[0] as { message: string }
      // console.log('YouTube preload script loaded:', preloadData.message)
      break
    }

    case YTM_PLAYER_STATE: {
      usePlayerStore.getState().applySnapshot(args[0] as PlayerSnapshot)
      break
    }
  }
}
