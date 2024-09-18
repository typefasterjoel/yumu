import React from "react";
import { Button } from "./ui/button";
import { Maximize, Minimize2, X } from "lucide-react";
import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/ipc/helpers/windows";
import SettingsMenu from "./settings-menu";

function WindowButtons() {
  return (
    <div className="flex items-center gap-2 px-3">
      <SettingsMenu />
      <Button
        variant="ghost"
        size="icon"
        onClick={minimizeWindow}
        className="text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground size-6"
      >
        <Minimize2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={maximizeWindow}
        className="text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground size-6"
      >
        <Maximize className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={closeWindow}
        className="text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground size-6"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

export default WindowButtons;
