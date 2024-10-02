import { ipcMain, type BrowserWindow } from "electron";
import { CLOSE_WINDOW, MAX_WINDOW, MIN_WINDOW } from "./types";
import { audioListeners } from "./audio";
import { discordListeners } from "./discord";
import { youtubeListeners } from "./youtube";

export function windowEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(MIN_WINDOW, () => {
    mainWindow.minimize();
  });

  ipcMain.handle(MAX_WINDOW, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(CLOSE_WINDOW, () => {
    mainWindow.close();
  });

  audioListeners();
  discordListeners();
  youtubeListeners();
}
