import React, { useRef } from "react";
import WindowButtons from "./components/window-buttons";
import { Toaster } from "./components/ui/toaster";

function App() {
  const webviewRef = useRef<Electron.WebviewTag>(null);

  return (
    <div className="bg-primary relative flex h-screen w-screen overflow-hidden">
      <div className="bg-primary fixed left-0 top-0 z-10 w-full">
        <div className="flex items-center justify-between">
          <div className="title-bar flex-grow px-3 py-2">
            <h1 className="text-primary-foreground text-sm">
              Yumu / YouTube Music Desktop Player
            </h1>
          </div>
          <WindowButtons />
        </div>
      </div>
      <div className="relative h-full w-full pt-9">
        <webview
          id="yumu-youtube-music-webview"
          ref={webviewRef}
          src="https://music.youtube.com"
          className="h-full w-full"
        />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
