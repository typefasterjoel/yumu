import { type AudioDevice } from '@ipc/types'

export async function receiveYouTubeEvents(event: Electron.IpcMessageEvent) {
  const { channel, args } = event

  switch (channel) {
    case 'youtube:audio': {
      const audioDevices = args[0] as AudioDevice[]
      console.log('Received audio devices:', audioDevices)
      window.yumu.preloadAudioDevices(audioDevices)
      break
    }

    case 'youtube:preload-ready': {
      const preloadData = args[0] as { message: string }
      console.log('YouTube preload script loaded:', preloadData.message)
      break
    }
  }
}
