import { contextBridge, ipcRenderer } from "electron";
import {
  CLOSE_WINDOW,
  GET_AUDIO_DEVICES,
  MAX_WINDOW,
  MEDIA_NEXT_TRACK,
  MEDIA_PLAY_PAUSE,
  MEDIA_PREV_TRACK,
  MIN_WINDOW,
  SET_AUDIO_DEVICE,
  SONG_PAUSED,
  SONG_PLAYING,
  SongInfo,
  TOGGLE_DISCORD_RP,
  UPDATE_SONG_INFO,
} from "./types";
import path from "path";

export function exposeWindowContext() {
  contextBridge.exposeInMainWorld("yumuWindow", {
    // Window
    minimize: () => ipcRenderer.invoke(MIN_WINDOW),
    maximize: () => ipcRenderer.invoke(MAX_WINDOW),
    close: () => ipcRenderer.invoke(CLOSE_WINDOW),
    // Audio
    setAudioDevice: (deviceId: string) =>
      ipcRenderer.invoke(SET_AUDIO_DEVICE, deviceId),
    getAudioDevices: () => ipcRenderer.invoke(GET_AUDIO_DEVICES),

    // Discord
    toggleDiscordRichPresence: (enabled: boolean) =>
      ipcRenderer.invoke(TOGGLE_DISCORD_RP, enabled),
    updateSongInfo: (songInfo: SongInfo) =>
      ipcRenderer.invoke(UPDATE_SONG_INFO, songInfo),

    // Youtube
    youtubeMusicUpdate: (songInfo: SongInfo) =>
      ipcRenderer.invoke(SONG_PLAYING, songInfo),
    youtubeMusicPause: (songInfo: SongInfo) =>
      ipcRenderer.invoke(SONG_PAUSED, songInfo),

    // Media
    onMediaPlayPause: (callback: () => void) =>
      ipcRenderer.on(MEDIA_PLAY_PAUSE, callback),
    onMediaNextTrack: (callback: () => void) =>
      ipcRenderer.on(MEDIA_NEXT_TRACK, callback),
    onMediaPrevTrack: (callback: () => void) =>
      ipcRenderer.on(MEDIA_PREV_TRACK, callback),
  });
}
