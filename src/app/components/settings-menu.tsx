import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Headphones, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "../hooks/use-toast";
import {
  LOCAL_AUDIO_DEVICE_KEY,
  LOCAL_DISCORD_RP_ENABLED_KEY,
} from "@/ipc/window/types";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

function SettingsMenu() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isChangingDevice, setIsChangingDevice] = useState(false);
  const [isDiscordRPEnabled, setIsDiscordRPEnabled] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await window.yumuWindow.getAudioDevices();
        if (devices.success) {
          setDevices(devices.devices);
          const savedDeviceId = localStorage.getItem(LOCAL_AUDIO_DEVICE_KEY);
          if (
            savedDeviceId &&
            devices.devices.find((d) => d.deviceId === savedDeviceId)
          ) {
            setSelectedDevice(savedDeviceId);
            handleNewDevice(savedDeviceId);
          }
        }
      } catch (error) {
        console.error("Error getting audio devices:", error);
        toast({
          title: "Error",
          description:
            "Failed to get audio devices. Please check your browser permissions.",
          variant: "destructive",
        });
      }
    };

    getDevices();
    const discordRPEnabled =
      localStorage.getItem(LOCAL_DISCORD_RP_ENABLED_KEY) === "true";
    setIsDiscordRPEnabled(discordRPEnabled);
  }, []);

  const handleNewDevice = async (deviceId: string) => {
    setIsChangingDevice(true);
    setSelectedDevice(deviceId);
    try {
      const result = await window.yumuWindow.setAudioDevice(deviceId);

      if (result.success) {
        localStorage.setItem(LOCAL_AUDIO_DEVICE_KEY, deviceId);
        toast({
          title: "Audio Device Changed Successfully",
        });
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Failed to change audio device:", error);
      toast({
        title: "Error",
        description: `Failed to change audio device: ${(error as Error).message}. Please try refreshing the page or restarting the app.`,
        variant: "destructive",
      });
    } finally {
      setIsChangingDevice(false);
    }
  };

  const handleDiscordToggle = async (checked: boolean) => {
    setIsDiscordRPEnabled(checked);
    localStorage.setItem(LOCAL_DISCORD_RP_ENABLED_KEY, checked.toString());
    window.yumuWindow.toggleDiscordRichPresence(checked);
    toast({
      title: checked
        ? "Discord Rich Presence Enabled"
        : "Discord Rich Presence Disabled",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground"
        >
          <Settings2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" side="bottom">
        <div className="flex flex-col gap-4 divide-y">
          <div className="flex flex-col gap-0">
            <h4 className="text-md font-medium">Settings</h4>
            <h5 className="text-xs text-primary">
              Quick settings for your music.
            </h5>
          </div>
          <div className="flex flex-col gap-0">
            <h6 className="mb-2 mt-2 flex items-center gap-1 text-base font-medium">
              <Headphones className="size-4" />
              Audio Output
            </h6>
            <Select
              disabled={isChangingDevice}
              value={selectedDevice}
              onValueChange={handleNewDevice}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Audio Output" />
              </SelectTrigger>
              <SelectContent align="end" side="bottom">
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-0">
            <h6 className="mb-2 mt-2 flex items-center gap-1 text-base font-medium">
              <DiscordLogoIcon className="size-4" />
              Discord Rich Presence
            </h6>
            <div className="flex items-center gap-2">
              <Switch
                id="discord-rich-presence"
                checked={isDiscordRPEnabled}
                onCheckedChange={handleDiscordToggle}
              />
              <Label htmlFor="discord-rich-presence">
                Enable Discord Rich Presence
              </Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SettingsMenu;
