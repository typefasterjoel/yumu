# Yumu / Unofficial YouTube Music Application

[![Release](https://github.com/typefasterjoel/yumu/actions/workflows/release.yml/badge.svg)](https://github.com/typefasterjoel/yumu/actions/workflows/release.yml)

This is an electron app wrapper for YouTube music that helps deal with some missing features from the web application currently online.

## Current Features

- **Audio Output Select** - This will allow you to select a different audio output for the program
- **Discord Presence** - Display what you're currently listening to to your Discord
- **Yumu UI (alpha)** - An optional interface of Yumu's own, built on top of YouTube Music: Home, Library, search, a queue panel and player controls. It's off by default and can be turned on in Settings. Some features are still missing, and switching it off returns you to the regular YouTube Music page.

## For Development

If you wish you contribute to the development of this application, you can pull the repo and install it on your machine by running `pnpm install` to run use the command `pnpm dev`.

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
