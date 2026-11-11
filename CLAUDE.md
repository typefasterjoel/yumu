# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Yumu is an unofficial YouTube Music desktop application built with Electron, React, and TypeScript. It embeds YouTube Music in a `<webview>` tag and adds features on top: Discord Rich Presence, audio output device selection, and global media key bindings.

## Commands

```bash
pnpm dev              # Start in development mode with HMR
pnpm build            # Typecheck + build all processes
pnpm build:unpack     # Build and unpack to dist/ (no installer)
pnpm build:win        # Build Windows installer
pnpm typecheck        # Run both node and web typechecks
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
```

Typechecks are split: `typecheck:node` covers the main/preload processes; `typecheck:web` covers the renderer.

## Architecture

### Three-process Electron model

**Main process** (`src/main/index.ts`) — creates the frameless `BrowserWindow`, registers global media key shortcuts, and calls `windowEventListeners()` which wires up all `ipcMain.handle` handlers.

**Preload scripts** — there are two:

- `src/preload/index.ts` — loaded by the main window. Exposes `window.electron` (from `@electron-toolkit/preload`) and `window.yumu` (the full IPC API surface defined in `src/ipc/api.ts`).
- `src/preload/youtube.ts` — injected into the `<webview>`. Runs inside the YouTube Music page context. Scrapes song metadata from the DOM, listens for video `play`/`pause`/`seeked` events, and forwards data back to the renderer via `ipcRenderer.sendToHost`.

**Renderer process** (`src/renderer/src/`) — React 19 app. The main layout is in `App.tsx`: a fixed `ApplicationToolbar` (with OS-specific window controls) plus `YouTubeView` which renders the `<webview>`.

### IPC pattern

All IPC channel names and shared types live in `src/ipc/types.ts`. Adding a new channel requires:

1. Adding a constant to `src/ipc/types.ts`
2. Adding the handler in the appropriate file under `src/ipc/` (discord, audio, window)
3. Adding the method to `YumuIpcApi` in `src/ipc/api.ts` and implementing it

The renderer accesses the API as `window.yumu.<method>()`.

### webview ↔ renderer communication

The YouTube preload script sends messages via `ipcRenderer.sendToHost(channel, data)`. The renderer's `YouTubeView` component listens on the webview's `ipc-message` event and dispatches to `receiveYouTubeEvents()` in `src/ipc/youtube/receiver.ts`. That function calls back into `window.yumu.*` to relay events to the main process (e.g., Discord updates).

### Path aliases

| Alias       | Resolves to        |
| ----------- | ------------------ |
| `@ipc`      | `src/ipc`          |
| `@renderer` | `src/renderer/src` |

### Settings persistence

User settings (Discord toggle, audio device) are stored in `localStorage` using the key constants from `src/ipc/types.ts` (`LOCAL_DISCORD_SETTING`, `LOCAL_AUDIO_DEVICE_KEY`, `LOCAL_YUMU_UI_SETTING`).

### Platform differences

- macOS: uses `titleBarStyle: 'hiddenInset'`, hides native traffic lights (`setWindowButtonVisibility(false)`), renders custom Mac-style window controls (`MacWindowControls`) on the left, and requires accessibility permission for media key registration.
- Windows/Linux: renders minimize/maximize/close buttons on the right using `Button` with ghost variant.
