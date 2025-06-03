export const MIN_WINDOW = 'window:minimize'
export const MAX_WINDOW = 'window:maximize'
export const CLOSE_WINDOW = 'window:close'

// Discord IPC types
export const LOCAL_DISCORD_SETTING = 'discordEnabled'
export const TOGGLE_DISCORD = 'discord:toggle'
export const DISCORD_UPDATE_SONG = 'discord:update-song'

// Audio Selection IPC types
export const LOCAL_AUDIO_DEVICE_KEY = 'audioDevice'
export const PRELOAD_AUDIO_DEVICES = 'audio:preload-devices'
export const AUDIO_DEVICES_READY = 'audio:devices-ready'
export const GET_AUDIO_DEVICES = 'audio:get-devices'
export const SET_AUDIO_DEVICE = 'audio:set-device'

// YUMU settings
export const LOCAL_YUMU_UI_SETTING = 'yumuUiEnabled'
export const YUMU_UI_TOGGLE = 'yumu:ui-toggle'

// Youtube Types
export const YOUTUBE_PRELOAD_SCRIPT = 'yumu:youtube-preload-script'

export type SongInfo = {
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
  currentTime: number
}

export type DiscordActivity = {
  type: number
  details: string
  state: string
  startTimestamp?: number
  endTimestamp?: number
  largeImageKey: string
  largeImageText: string
  instance: boolean
}

export type AudioDevice = {
  deviceId: string
  label: string
}
