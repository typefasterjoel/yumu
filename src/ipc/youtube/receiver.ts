import { type AudioDevice } from "@ipc/types"
import { usePlayerStore } from "@ipc/stores/player-store"
import { useQueueStore } from "@ipc/stores/queue-store"
import {
  YTM_PLAYER_STATE,
  YTM_QUEUE,
  type PlayerSnapshot,
  type QueueSnapshot
} from "@ipc/youtube/bridge"

export async function receiveYouTubeEvents(event: Electron.IpcMessageEvent) {
  const { channel, args } = event

  switch (channel) {
    case "youtube:audio": {
      const audioDevices = args[0] as AudioDevice[]
      window.yumu.preloadAudioDevices(audioDevices)
      break
    }

    case "youtube:preload-ready": {
      break
    }

    case YTM_PLAYER_STATE: {
      usePlayerStore.getState().applySnapshot(args[0] as PlayerSnapshot)
      break
    }

    case YTM_QUEUE: {
      useQueueStore.getState().setQueue(args[0] as QueueSnapshot)
      break
    }
  }
}
