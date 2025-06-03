import { ipcRenderer } from 'electron'
import {
  AUDIO_DEVICES_READY,
  CLOSE_WINDOW,
  DISCORD_UPDATE_SONG,
  GET_AUDIO_DEVICES,
  MAX_WINDOW,
  MIN_WINDOW,
  PRELOAD_AUDIO_DEVICES,
  SET_AUDIO_DEVICE,
  TOGGLE_DISCORD,
  YOUTUBE_PRELOAD_SCRIPT,
  YUMU_UI_TOGGLE,
  type AudioDevice,
  type SongInfo
} from './types'

export interface YumuIpcApi {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  // Discord methods
  toggleDiscordPresence: (check: boolean) => Promise<{ success: boolean }>
  updateDiscord: (song: SongInfo, state: string) => Promise<void>

  // Yumu UI
  toggleYumuUi: (check: boolean) => Promise<{ enabled: boolean }>

  // Youtube
  getYoutubePreloadScriptPath: () => Promise<string>

  // Audio
  preloadAudioDevices: (devices: AudioDevice[]) => Promise<AudioDevice[]>
  getAudioDevices: () => Promise<AudioDevice[]>
  setAudioDevice: (deviceId: string) => Promise<void>
  onAudioDevicesReady: (callback: (devices: AudioDevice[]) => void) => void
}

export default {
  minimize: () => ipcRenderer.invoke(MIN_WINDOW),
  maximize: () => ipcRenderer.invoke(MAX_WINDOW),
  close: () => ipcRenderer.invoke(CLOSE_WINDOW),
  toggleDiscordPresence: (enabled: boolean) => ipcRenderer.invoke(TOGGLE_DISCORD, enabled),
  updateDiscord: (song: SongInfo, state: string) =>
    ipcRenderer.invoke(DISCORD_UPDATE_SONG, song, state),
  toggleYumuUi: (enabled: boolean) => ipcRenderer.invoke(YUMU_UI_TOGGLE, enabled),
  getYoutubePreloadScriptPath: () => ipcRenderer.invoke(YOUTUBE_PRELOAD_SCRIPT),
  preloadAudioDevices: (devices: AudioDevice[]) =>
    ipcRenderer.invoke(PRELOAD_AUDIO_DEVICES, devices),
  getAudioDevices: () => ipcRenderer.invoke(GET_AUDIO_DEVICES),
  setAudioDevice: (deviceId: string) => ipcRenderer.invoke(SET_AUDIO_DEVICE, deviceId),
  onAudioDevicesReady: (callback: (devices: AudioDevice[]) => void) => {
    const handler = (_: unknown, devices: AudioDevice[]) => callback(devices)
    ipcRenderer.on(AUDIO_DEVICES_READY, handler)
    return () => {
      ipcRenderer.removeListener(AUDIO_DEVICES_READY, handler)
    }
  }
} as YumuIpcApi
