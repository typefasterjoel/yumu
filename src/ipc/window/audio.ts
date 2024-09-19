import { BrowserWindow, ipcMain, webContents } from "electron";
import {
  GET_AUDIO_DEVICES,
  LOCAL_AUDIO_DEVICE_KEY,
  SET_AUDIO_DEVICE,
} from "./types";

export function audioListeners() {
  ipcMain.handle(GET_AUDIO_DEVICES, async () => {
    try {
      const webview = webContents
        .getAllWebContents()
        .find((wc) => wc.getType() === "webview");

      if (!webview) {
        throw new Error("Webview not found");
      }

      const devices = await webview.executeJavaScript(`
        (async () => {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
              .filter(device => device.kind === 'audiooutput')
              .map(device => ({ deviceId: device.deviceId, label: device.label }));
          } catch (error) {
            console.error('Error getting audio devices:', error);
            return [];
          }
        })();
      `);

      return { success: true, devices };
    } catch (error) {
      console.error("Error in getAudioDevices:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(SET_AUDIO_DEVICE, async (_, deviceId: string) => {
    try {
      const webview = webContents
        .getAllWebContents()
        .find((wc) => wc.getType() === "webview");

      if (!webview) {
        throw new Error("Webview not found");
      }

      console.log("Attempting to set audio device:", deviceId);

      // Execute the setAudioDevice function in the webview's context
      const result = await webview.executeJavaScript(`
        (async () => {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const selectedDevice = devices.find((device) => device.deviceId === '${deviceId}');
            console.log("from webview:", selectedDevice)
            const audio = document.querySelector('video, audio');
            if (!audio) {
              console.error('No audio element found');
              return { success: false, error: 'No audio element found' };
            }
            if (!audio.setSinkId) {
              console.error('setSinkId is not supported');
              return { success: false, error: 'setSinkId is not supported in this browser' };
            }
            await audio.setSinkId(selectedDevice.deviceId);
            console.log('Audio output set to ' + selectedDevice.label);
            return { success: true };
          } catch (error) {
            console.error('Error setting audio output', error);
            return { success: false, error: error.toString() };
          }
        })();
      `);

      console.log("Result from webview:", result);

      return result;
    } catch (error) {
      console.error("Error in audioListeners:", error);
      return { success: false, error: (error as Error).message };
    }
  });
}

export async function setInitialAudioDevice(mainWindow: BrowserWindow) {
  try {
    const result = await mainWindow.webContents.executeJavaScript(`
      localStorage.getItem('${LOCAL_AUDIO_DEVICE_KEY}');
    `);

    if (result) {
      console.log("Setting initial audio device:", result);
      return await ipcMain.emit(SET_AUDIO_DEVICE, result);
    }
  } catch (error) {
    console.error("Error setting initial audio device:", error);
  }
}
