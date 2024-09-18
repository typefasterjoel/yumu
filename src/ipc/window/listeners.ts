import { ipcMain, type BrowserWindow } from "electron";
import { CLOSE_WINDOW, MAX_WINDOW, MIN_WINDOW } from "./types";

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
}
