import type { BrowserWindow } from "electron";
import { windowEventListeners } from "./window/listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  windowEventListeners(mainWindow);
}
