import { ElectronAPI } from '@electron-toolkit/preload'
import type { YumuIpcApi } from '@ipc/api'

declare global {
  interface Window {
    electron: ElectronAPI
    yumu: YumuIpcApi
  }
}
