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

function SettingsMenu() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isChangingDevice, setIsChangingDevice] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await window.yumuWindow.getAudioDevices();
        if (devices.success) {
          setDevices(devices.devices);
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
  }, []);

  const handleNewDevice = async (deviceId: string) => {
    setIsChangingDevice(true);
    setSelectedDevice(deviceId);
    try {
      console.log("Attempting to set audio device:", deviceId);
      const result = await window.yumuWindow.setAudioDevice(deviceId);
      console.log("Result from setAudioDevice:", result);

      if (result.success) {
        toast({
          title: "Audio Device Changed",
          description: `Audio output set to ${devices.find((d) => d.deviceId === deviceId)?.label}`,
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground size-6"
        >
          <Settings2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" side="bottom">
        <div className="flex flex-col gap-3 divide-y">
          <div className="flex flex-col gap-0">
            <h4 className="text-md font-medium">Settings</h4>
            <h5 className="text-primary text-xs">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SettingsMenu;
