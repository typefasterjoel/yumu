import React from "react";
import { Button } from "./ui/button";
import { Minus, Square, X } from "lucide-react";
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
        className="size-6 text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground"
      >
        <Minus className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={maximizeWindow}
        className="size-6 text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground"
      >
        <Square className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={closeWindow}
        className="size-6 text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

export default WindowButtons;
