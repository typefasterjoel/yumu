import { discordListeners } from '@ipc/helpers/discord'
import { CLOSE_WINDOW, MAX_WINDOW, MIN_WINDOW, YOUTUBE_PRELOAD_SCRIPT } from '@ipc/types'
import { audioEventListeners } from '@ipc/window/audio'
import { app, ipcMain, type BrowserWindow } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function windowEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(MIN_WINDOW, () => {
    console.log('Minimizing window')
    mainWindow.minimize()
  })

  ipcMain.handle(MAX_WINDOW, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.handle(CLOSE_WINDOW, () => {
    mainWindow.close()
  })

  ipcMain.handle(YOUTUBE_PRELOAD_SCRIPT, () => {
    let preloadPath
    const preloadName = 'youtube.js'

    if (process.env.NODE_ENV === 'development') {
      preloadPath = path.join(app.getAppPath(), 'out', 'preload', preloadName)
    } else {
      preloadPath = path.join(__dirname, '..', 'preload', preloadName)
    }

    return pathToFileURL(preloadPath).toString()
  })

  // Discord
  discordListeners()

  // Audio
  audioEventListeners()
}
