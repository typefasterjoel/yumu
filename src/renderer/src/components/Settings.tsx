import { LOCAL_AUDIO_DEVICE_KEY, LOCAL_DISCORD_SETTING, type AudioDevice } from "@ipc/types"
import { useUiStore } from "@ipc/stores/ui-store"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Label } from "@renderer/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@renderer/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/components/ui/select"
import { Switch } from "@renderer/components/ui/switch"
import { HeadphonesIcon, Settings2Icon, SwatchBookIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { LiaDiscord } from "react-icons/lia"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

function Settings() {
  const [isDiscordEnabled, setIsDiscordEnabled] = useState(() => {
    return localStorage.getItem(LOCAL_DISCORD_SETTING) === "true"
  })
  const isYumuUIEnabled = useUiStore((s) => s.customUiEnabled)
  const setCustomUiEnabled = useUiStore((s) => s.setCustomUiEnabled)

  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<AudioDevice["deviceId"]>("")

  const updateAudioDevicesState = useCallback((devices: AudioDevice[]) => {
    if (devices.length) {
      setAudioDevices(devices)
      const localStorageDevice = localStorage.getItem(LOCAL_AUDIO_DEVICE_KEY) || ""
      const deviceExists = devices.some((device) => device.deviceId === localStorageDevice)
      if (deviceExists) {
        setSelectedAudioDevice(localStorageDevice)
        window.yumu.setAudioDevice(localStorageDevice)
      }
    }
  }, [])

  useEffect(() => {
    const fetchAudioDevices = async () => {
      try {
        if (window.yumu) {
          const devices = await window.yumu.getAudioDevices()

          updateAudioDevicesState(devices)
        }
      } catch (error) {
        console.error("Failed to fetch audio devices:", error)
        updateAudioDevicesState([])
      }
    }
    fetchAudioDevices()
    let cleanupListener
    if (window.yumu && window.yumu.onAudioDevicesReady) {
      cleanupListener = window.yumu.onAudioDevicesReady((devices) => {
        updateAudioDevicesState(devices)
      })
    }

    const enableDiscord = async () => {
      const discordStatus = await window.yumu.getDiscordStatus()
      const discordEnabled = localStorage.getItem(LOCAL_DISCORD_SETTING) === "true"
      if (discordEnabled && !discordStatus) {
        await window.yumu.toggleDiscordPresence(discordEnabled)
      }
    }
    enableDiscord()

    return () => {
      if (cleanupListener) {
        cleanupListener()
      }
    }
  }, [updateAudioDevicesState])

  const handleToggleDiscord = async (checked: boolean) => {
    setIsDiscordEnabled(checked)
    localStorage.setItem(LOCAL_DISCORD_SETTING, String(checked))
    if (window.yumu) {
      window.yumu.toggleDiscordPresence(checked)
    }
  }

  const handleAudioDeviceChange = async (deviceId: AudioDevice["deviceId"] | null) => {
    if (deviceId === null) return
    setSelectedAudioDevice(deviceId)
    localStorage.setItem(LOCAL_AUDIO_DEVICE_KEY, deviceId)
    if (window.yumu) {
      await window.yumu.setAudioDevice(deviceId)
    }
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <Settings2Icon className="size-4" />
                </Button>
              }
            />
          }
        />
        <TooltipContent side="bottom">Settings</TooltipContent>
      </Tooltip>
      <PopoverContent className="-mt-2 w-80" align="end" side="bottom">
        <div className="flex flex-col gap-5 divide-y">
          <div className="flex flex-col pb-4">
            <h2 className="text-lg font-semibold">Settings</h2>
            <h3 className="text-muted-foreground text-sm">Configure Yumu Settings</h3>
          </div>
          <div className="flex flex-col gap-2 pb-4">
            <div className="flex flex-col">
              <h4 className="flex items-center gap-2 font-medium">
                <HeadphonesIcon className="size-4" />
                Audio Output
              </h4>
              <h5 className="text-muted-foreground text-sm">
                Select the audio output device for Yumu
              </h5>
            </div>
            <Select
              itemToStringLabel={(item) =>
                audioDevices.find((d) => d.deviceId === item)?.label ?? item
              }
              value={selectedAudioDevice}
              onValueChange={handleAudioDeviceChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Audio Output" />
              </SelectTrigger>
              <SelectContent side="top" align="start" className="min-w-fit">
                {audioDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 pb-4">
            <div className="flex flex-col">
              <h4 className="flex items-center gap-2 font-medium">
                <LiaDiscord className="size-4" />
                Discord
              </h4>
              <h5 className="text-muted-foreground text-sm">
                Update Discord status with song information
              </h5>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Switch
                id="discord-rich-presence"
                checked={isDiscordEnabled}
                onCheckedChange={handleToggleDiscord}
              />
              <Label htmlFor="discord-rich-presence">Enable Discord Rich Presence</Label>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <h4 className="flex items-center gap-2 font-medium">
                <SwatchBookIcon className="size-4" />
                Yumu UI
                <Badge variant="secondary">Alpha</Badge>
              </h4>
              <h5 className="text-muted-foreground text-sm">
                {`Try Yumu's own interface in place of the default YouTube Music. Some features are still missing; switch it off any time to go back.`}
              </h5>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Switch id="yumu-ui" checked={isYumuUIEnabled} onCheckedChange={setCustomUiEnabled} />
              <Label htmlFor="yumu-ui">Enable Yumu UI</Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
export default Settings
