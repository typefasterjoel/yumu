import React, { useEffect, useRef } from "react";
import WindowButtons from "./components/window-buttons";
import { Toaster } from "./components/ui/toaster";
import { LOCAL_DISCORD_RP_ENABLED_KEY, SongInfo } from "@/ipc/window/types";

export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

function App() {
  const webviewRef = useRef<Electron.WebviewTag>(null);

  useEffect(() => {
    const discordRPEnabled =
      localStorage.getItem(LOCAL_DISCORD_RP_ENABLED_KEY) === "true";

    if (discordRPEnabled) {
      window.yumuWindow.toggleDiscordRichPresence(discordRPEnabled);
    }

    const webview = webviewRef.current;

    // webview.addEventListener("dom-ready", () => {
    //   webview.openDevTools();
    // });

    // Register media key listeners
    window.yumuWindow.onMediaPlayPause(() => {
      handlePlayPause();
    });

    window.yumuWindow.onMediaNextTrack(() => {
      handleSkipForward();
    });

    window.yumuWindow.onMediaPrevTrack(() => {
      handleSkipBack();
    });

    let songInterval: NodeJS.Timeout;

    const extractSongInfo = async () => {
      const script = `
        (function() {
        const title = document.querySelector('.ytmusic-player-bar .title')?.textContent || 'Unknown Title';
        const artistLine = document.querySelector('.ytmusic-player-bar .byline')?.textContent?.split('•') || null
        const artist = artistLine ? artistLine[0] : 'Unknown Artist';
        const album = artistLine ? artistLine[1] : 'Unknown Album';

        const songInfo = {
              title: document.querySelector('.ytmusic-player-bar .title')?.textContent || 'Unknown Title',
              artist: artist,
              album: album,
              albumArt: document.querySelector('.ytmusic-player-bar .image')?.src || '',
              currentTime: parseInt(document.querySelector('#progress-bar').getAttribute('aria-valuenow')) || 0,
              duration: parseInt(document.querySelector('#progress-bar').getAttribute('aria-valuemax')) || 0
            };

            return songInfo;
            })();
      `;

      const result: SongInfo = await webview.executeJavaScript(script);
      return result;
    };

    const updateSong = async () => {
      const song = await extractSongInfo();
      window.yumuWindow.updateSongInfo(song);
    };

    webview.addEventListener("media-started-playing", async () => {
      songInterval = setInterval(updateSong, 5000);
    });

    webview.addEventListener("media-paused", async () => {
      const song = await extractSongInfo();
      window.yumuWindow.youtubeMusicPause(song);
      clearInterval(songInterval);
    });

    return () => {
      clearInterval(songInterval);
    };
  }, []);

  const handlePlayPause = () => {
    const webview = webviewRef.current;
    if (!webview) return;

    const script = `
      (function() {
        const playPauseButton = document.querySelector('.ytmusic-player-bar [aria-label="Play"], .ytmusic-player-bar [aria-label="Pause"]');
        if (playPauseButton) {
          playPauseButton.click();
        }
      })();
    `;

    webview.executeJavaScript(script);
  };

  const handleSkipBack = () => {
    const webview = webviewRef.current;
    if (!webview) return;

    const script = `
      (function() {
        const prevButton = document.querySelector('.ytmusic-player-bar [aria-label="Previous"]');
        if (prevButton) {
          prevButton.click();
        }
      })();
    `;

    webview.executeJavaScript(script);
  };

  const handleSkipForward = () => {
    const webview = webviewRef.current;
    if (!webview) return;

    const script = `
      (function() {
        const nextButton = document.querySelector('.ytmusic-player-bar [aria-label="Next"]');
        if (nextButton) {
          nextButton.click();
        }
      })();
    `;

    webview.executeJavaScript(script);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-primary">
      <div className="fixed left-0 top-0 z-10 w-full bg-primary">
        <div className="flex items-center justify-between">
          <div className="title-bar flex-grow px-3 py-2">
            <h1 className="text-sm text-primary-foreground">
              Yumu / Unofficial YouTube Music Desktop Player
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
          useragent={userAgent}
          partition="persist:youtube"
        />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
