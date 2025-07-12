import {
  LOCAL_AUDIO_DEVICE_KEY,
  LOCAL_DISCORD_SETTING,
  // LOCAL_YUMU_UI_SETTING,
  type AudioDevice
} from '@ipc/types'
import { DiscordLogoIcon } from '@radix-ui/react-icons'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import { HeadphonesIcon, PaletteIcon, Settings2Icon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

function Settings() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [isDiscordEnabled, setIsDiscordEnabled] = useState(() => {
    return localStorage.getItem(LOCAL_DISCORD_SETTING) === 'true'
  })
  // const [isYumuUIEnabled, setIsYumuUIEnabled] = useState(() => {
  //   return localStorage.getItem(LOCAL_YUMU_UI_SETTING) === 'true'
  // })

  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<AudioDevice['deviceId']>('')

  const updateAudioDevicesState = useCallback((devices: AudioDevice[]) => {
    if (devices.length) {
      setAudioDevices(devices)
      const localStorageDevice = localStorage.getItem(LOCAL_AUDIO_DEVICE_KEY) || ''
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
        console.error('Failed to fetch audio devices:', error)
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
      const discordEnabled = localStorage.getItem(LOCAL_DISCORD_SETTING) === 'true'
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

  // const handleToggleYumuUI = async (checked: boolean) => {
  //   setIsYumuUIEnabled(checked)
  //   localStorage.setItem(LOCAL_YUMU_UI_SETTING, String(checked))
  // }

  const handleAudioDeviceChange = async (deviceId: AudioDevice['deviceId']) => {
    setSelectedAudioDevice(deviceId)
    localStorage.setItem(LOCAL_AUDIO_DEVICE_KEY, deviceId)
    if (window.yumu) {
      await window.yumu.setAudioDevice(deviceId)
    }
  }

  return (
    <>
      {showOverlay && <div className="fixed inset-0 z-50 bg-black/30" aria-hidden="true" />}

      <Popover onOpenChange={() => setShowOverlay(!showOverlay)}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings2Icon className="size-4" />
          </Button>
        </PopoverTrigger>
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
              <Select value={selectedAudioDevice} onValueChange={handleAudioDeviceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Audio Output" />
                </SelectTrigger>
                <SelectContent align="end" side="bottom">
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
                  <DiscordLogoIcon className="size-4" />
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
                  <PaletteIcon className="size-4" />
                  Yumu UI
                </h4>
                <h5 className="text-muted-foreground text-sm">
                  {`Use Yumu's custom UI instead of the default YouTube Music`}
                </h5>
              </div>
              <div className="mt-1 flex items-center gap-2">
                {/*<Switch
                  id="yumu-ui"
                  checked={isYumuUIEnabled}
                  onCheckedChange={handleToggleYumuUI}
                />
                <Label htmlFor="yumu-ui">Enable Yumu UI</Label> */}
                <h6 className="font-lg font-semibold">Coming Soon!</h6>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
export default Settings
