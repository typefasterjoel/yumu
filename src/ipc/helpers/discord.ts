import {
  DISCORD_CLEAR_ACTIVITY,
  DISCORD_GET_STATUS,
  DISCORD_UPDATE_SONG,
  TOGGLE_DISCORD,
  type SongInfo
} from "@ipc/types"
import { Client, type SetActivity } from "@xhayper/discord-rpc"
import { ipcMain } from "electron"

const clientId = "1286520235893198899"
let discordClient: Client | null = null
let initialized = false
let wanted = false
let connecting = false
let reconnectTimer: NodeJS.Timeout | null = null
let watchdog: NodeJS.Timeout | null = null
let lastActivity: { song: SongInfo; state: string; at: number } | null = null

const retryDelay = 10000 // 10 seconds
const watchdogInterval = 5000

function scheduleReconnect() {
  if (!wanted || reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, retryDelay)
}

function dropClient() {
  const client = discordClient
  discordClient = null
  initialized = false
  client?.removeAllListeners()
  client?.destroy().catch(() => {})
}

/** A request on a dead connection means the "disconnected" event was missed, so reconnect here. */
function recoverIfDisconnected(client: Client | null) {
  if (!client || client !== discordClient || client.isConnected) return
  console.warn("Discord connection lost; reconnecting.")
  dropClient()
  scheduleReconnect()
}

async function connect() {
  if (!wanted || initialized || connecting) return

  connecting = true
  const client = new Client({ clientId })
  discordClient = client
  client.on("ready", () => {
    initialized = true
    console.info("Discord connected")
    if (!lastActivity) return
    const { song, state, at } = lastActivity
    const elapsed = state === "paused" ? 0 : (Date.now() - at) / 1000
    updateDiscordActivity({ ...song, currentTime: song.currentTime + elapsed }, state)
  })
  // Discord closing or restarting drops the socket; keep trying until it is back.
  client.on("disconnected", () => {
    if (discordClient !== client) return
    console.warn("Discord disconnected; reconnecting.")
    dropClient()
    scheduleReconnect()
  })

  try {
    await client.login()
  } catch (error) {
    console.error("Failed to login to Discord RPC:", error)
    if (discordClient === client) dropClient()
    scheduleReconnect()
  } finally {
    connecting = false
  }
}

export async function initializeDiscordPresence() {
  wanted = true
  // Discord can quit without the socket reporting it, so check the connection now and then.
  watchdog ??= setInterval(() => {
    if (initialized) recoverIfDisconnected(discordClient)
  }, watchdogInterval)
  await connect()
}

export async function updateDiscordActivity(song: SongInfo, state: string) {
  lastActivity = { song, state, at: Date.now() }
  if (!initialized) return

  try {
    const activity: SetActivity = {
      type: 2,
      name: song.artist ? `${song.title} by ${song.artist}` : "music on Yumu",
      details: song.title,
      state: `by ${song.artist}`,
      startTimestamp: Date.now() - song.currentTime * 1000,
      endTimestamp: Date.now() + (song.duration - song.currentTime) * 1000,
      largeImageKey: song.albumArt,
      largeImageText: song.album,
      smallImageKey: "yumu-icon",
      smallImageText: "Yumu",
      instance: false
    }

    if (state === "paused") {
      activity.startTimestamp = undefined
      activity.endTimestamp = undefined
    }

    const client = discordClient
    try {
      await client?.user?.setActivity(activity)
    } catch (error) {
      console.error("Failed to update Discord activity:", error)
      recoverIfDisconnected(client)
    }
  } catch (error) {
    console.error("Failed to update Discord activity:", error)
  }
}

/** Removes the current activity but keeps the Discord connection open for the next song. */
export async function resetDiscordActivity() {
  lastActivity = null
  if (!initialized) return

  const client = discordClient
  try {
    await client?.user?.clearActivity()
  } catch (error) {
    console.error("Failed to reset Discord activity:", error)
    recoverIfDisconnected(client)
  }
}

export async function clearDiscordActivity() {
  wanted = false
  lastActivity = null
  if (watchdog) clearInterval(watchdog)
  watchdog = null
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  if (!initialized) {
    dropClient()
    return
  }

  await discordClient?.user?.clearActivity().catch(() => {})
  dropClient()
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

  ipcMain.handle(DISCORD_CLEAR_ACTIVITY, async () => {
    await resetDiscordActivity()
  })

  ipcMain.handle(DISCORD_GET_STATUS, () => {
    return initialized
  })
}
