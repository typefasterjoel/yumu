import { contextBridge, ipcRenderer } from "electron";
import {
  CLOSE_WINDOW,
  MAX_WINDOW,
  MIN_WINDOW,
  SET_AUDIO_DEVICE,
} from "./types";

export function exposeWindowContext() {
  contextBridge.exposeInMainWorld("yumuWindow", {
    minimize: () => ipcRenderer.invoke(MIN_WINDOW),
    maximize: () => ipcRenderer.invoke(MAX_WINDOW),
    close: () => ipcRenderer.invoke(CLOSE_WINDOW),
    setAudioDevice: (deviceId: string) =>
      ipcRenderer.invoke(SET_AUDIO_DEVICE, deviceId),
  });
}
