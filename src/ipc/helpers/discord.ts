import { DISCORD_GET_STATUS, DISCORD_UPDATE_SONG, TOGGLE_DISCORD, type SongInfo } from '@ipc/types'
import { Client, type SetActivity } from '@xhayper/discord-rpc'
import { ipcMain } from 'electron'

const clientId = '1286520235893198899'
let discordClient: Client | null = null
let initialized = false

const maxTries = 5
let currentTry = 0
const retryDelay = 10000 // 10 seconds
let isRetrying = false

export async function initializeDiscordPresence() {
  if (initialized || isRetrying) return

  try {
    isRetrying = true
    discordClient = new Client({ clientId: clientId })
    discordClient.on('ready', () => {
      initialized = true
      isRetrying = false
      currentTry = 0 // Reset try counter on success
    })
    console.log('Initializing Discord')
    await discordClient.login().catch((error) => {
      console.error('Failed to login to Discord RPC:', error)
      if (!initialized && currentTry < maxTries) {
        currentTry++
        setTimeout(() => {
          isRetrying = false
          initializeDiscordPresence()
        }, retryDelay)
      } else {
        isRetrying = false
        if (currentTry >= maxTries) {
          console.error('Max retries reached for Discord RPC initialization.')
        }
      }
    })
  } catch (error) {
    isRetrying = false
    console.error('Failed to initialize Discord presence:', error)
  }
}

export async function updateDiscordActivity(song: SongInfo, state: string) {
  if (!initialized) return

  try {
    const activity: SetActivity = {
      type: 2,
      details: song.title,
      state: `by ${song.artist}`,
      startTimestamp: Date.now() - song.currentTime * 1000,
      endTimestamp: Date.now() + (song.duration - song.currentTime) * 1000,
      largeImageKey: song.albumArt,
      largeImageText: song.album,
      smallImageKey: 'yumu-icon',
      smallImageText: 'Yumu',
      instance: false
    }

    if (state === 'paused') {
      activity.startTimestamp = undefined
      activity.endTimestamp = undefined
    }

    try {
      await discordClient?.user?.setActivity(activity)
    } catch (error) {
      console.error('Failed to update Discord activity:', error)
    }
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
    if (enabled && !initialized) {
      await initializeDiscordPresence()
    } else {
      await clearDiscordActivity()
    }
  })

  ipcMain.handle(DISCORD_UPDATE_SONG, async (_, song: SongInfo, state: string) => {
    await updateDiscordActivity(song, state)
  })

  ipcMain.handle(DISCORD_GET_STATUS, () => {
    return initialized
  })
}

export function getDiscordStatus() {
  return initialized
}
