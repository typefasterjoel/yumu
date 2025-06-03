import {
  DISCORD_UPDATE_SONG,
  TOGGLE_DISCORD,
  type DiscordActivity,
  type SongInfo
} from '@ipc/types'
import { Client } from '@xhayper/discord-rpc'
import { ipcMain } from 'electron'

const clientId = '1286520235893198899'
let discordClient: Client | null = null
let initialized = false

export async function initializeDiscordPresence() {
  if (initialized) return

  try {
    discordClient = new Client({ clientId: clientId })
    discordClient.on('ready', () => {
      initialized = true
    })
    await discordClient.login()
  } catch (error) {
    console.error('Failed to initialize Discord presence:', error)
  }
}

export async function updateDiscordActivity(song: SongInfo, state: string) {
  if (!initialized) return

  try {
    const activity: DiscordActivity = {
      type: 2,
      details: song.title,
      state: `by ${song.artist}`,
      startTimestamp: Date.now() - song.currentTime * 1000,
      endTimestamp: Date.now() + (song.duration - song.currentTime) * 1000,
      largeImageKey: song.albumArt,
      largeImageText: song.album,
      instance: false
    }

    if (state === 'paused') {
      activity.startTimestamp = undefined
      activity.endTimestamp = undefined
    }

    await discordClient?.user?.setActivity(activity)
  } catch (error) {
    console.error('Failed to update Discord activity:', error)
  }
}

export async function clearDiscordActivity() {
  if (!initialized) return

  await discordClient?.user?.clearActivity()
  await discordClient?.destroy()
  initialized = false
  discordClient = null
}

export function discordListeners() {
  ipcMain.handle(TOGGLE_DISCORD, async (_, enabled: boolean) => {
    if (enabled) {
      await initializeDiscordPresence()
    } else {
      await clearDiscordActivity()
    }
  })

  ipcMain.handle(DISCORD_UPDATE_SONG, async (_, song: SongInfo, state: string) => {
    await updateDiscordActivity(song, state)
  })
}
