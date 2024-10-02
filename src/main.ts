import { app, BrowserWindow, globalShortcut } from "electron";
import path from "path";
import registerListeners from "./ipc/register";
import { setInitialAudioDevice } from "./ipc/window/audio";
import {
  MEDIA_NEXT_TRACK,
  MEDIA_PLAY_PAUSE,
  MEDIA_PREV_TRACK,
} from "./ipc/window/types";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hidden",
    title: "Yumu / YouTube Music Desktop Player",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      webviewTag: true,
    },
  });

  // Load the listeners
  registerListeners(mainWindow);

  mainWindow.webContents.on("did-finish-load", () => {
    // Set the audio device from local storage
    setInitialAudioDevice(mainWindow);
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

const registerMediaShortcuts = () => {
  globalShortcut.register("MediaPlayPause", () => {
    mainWindow?.webContents.send(MEDIA_PLAY_PAUSE);
  });

  globalShortcut.register("MediaNextTrack", () => {
    mainWindow?.webContents.send(MEDIA_NEXT_TRACK);
  });

  globalShortcut.register("MediaPreviousTrack", () => {
    mainWindow?.webContents.send(MEDIA_PREV_TRACK);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  registerMediaShortcuts();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
