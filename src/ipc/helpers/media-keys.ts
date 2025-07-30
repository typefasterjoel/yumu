import { BrowserWindow, globalShortcut } from 'electron'
import { MEDIA_PLAY_PAUSE, MEDIA_NEXT_TRACK, MEDIA_PREVIOUS_TRACK, MEDIA_STOP } from '@ipc/types'

let mainWindow: BrowserWindow | null = null

export function setMediaKeysMainWindow(window: BrowserWindow) {
  mainWindow = window
}

export function registerMediaKeys() {
  if (!mainWindow) {
    console.error('Main window not set for media keys')
    return
  }

  // Register global shortcuts for media keys
  const shortcuts = [
    {
      accelerator: 'MediaPlayPause',
      event: MEDIA_PLAY_PAUSE,
      description: 'Play/Pause'
    },
    {
      accelerator: 'MediaNextTrack',
      event: MEDIA_NEXT_TRACK,
      description: 'Next Track'
    },
    {
      accelerator: 'MediaPreviousTrack',
      event: MEDIA_PREVIOUS_TRACK,
      description: 'Previous Track'
    },
    {
      accelerator: 'MediaStop',
      event: MEDIA_STOP,
      description: 'Stop'
    }
  ]

  let registeredCount = 0

  shortcuts.forEach(({ accelerator, event }) => {
    const success = globalShortcut.register(accelerator, () => {
      // Send the media key event to the renderer process
      mainWindow?.webContents.send(event)
    })

    if (success) {
      registeredCount++
    }
  })

  console.log(`Media keys registered: ${registeredCount}/${shortcuts.length}`)
}

export function unregisterMediaKeys() {
  globalShortcut.unregisterAll()
  console.log('All media keys unregistered')
}
