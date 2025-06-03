import {
  AUDIO_DEVICES_READY,
  GET_AUDIO_DEVICES,
  PRELOAD_AUDIO_DEVICES,
  SET_AUDIO_DEVICE,
  type AudioDevice
} from '@ipc/types'
import { type BrowserWindow, ipcMain } from 'electron'

let preloadedAudioDevices: AudioDevice[] = []
let mainWindow: BrowserWindow | null = null

export function setAudioMainWindow(window: BrowserWindow) {
  mainWindow = window
}

export function audioEventListeners() {
  ipcMain.handle(PRELOAD_AUDIO_DEVICES, async (_, devices: AudioDevice[]) => {
    preloadedAudioDevices = devices
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(AUDIO_DEVICES_READY, preloadedAudioDevices)
    }
    return preloadedAudioDevices
  })

  ipcMain.handle(GET_AUDIO_DEVICES, async () => {
    return preloadedAudioDevices
  })

  ipcMain.handle(SET_AUDIO_DEVICE, async (_, deviceId: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(SET_AUDIO_DEVICE, deviceId)
    }
    return deviceId
  })
}
