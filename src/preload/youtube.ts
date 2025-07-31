import { ipcRenderer } from 'electron'
import type { SongInfo } from '@ipc/types'

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.sendToHost('youtube:preload-ready', { message: 'YouTube preload script loaded' })

  // Get Audio Devices
  const getAudioDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices
        .filter((device) => device.kind === 'audiooutput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || 'Unknown Device'
        }))
      ipcRenderer.sendToHost('youtube:audio', audioDevices)
    } catch (error) {
      console.error('Failed to get audio devices:', error)
    }
  }
  getAudioDevices()

  // Listen for audio device changes
  ipcRenderer.on('audio:set-device', async (_, deviceId) => {
    console.log(`Setting audio output device to: ${deviceId}`)
    const audioElement = document.querySelector('video')
    if (audioElement) {
      try {
        await audioElement.setSinkId(deviceId)
      } catch (error) {
        console.error(`Failed to set audio output device: ${error}`)
      }
    } else {
      console.warn('No audio element found to set sink ID.')
    }
  })

  navigator.mediaDevices.addEventListener('devicechange', () => {
    getAudioDevices()
  })

  // Track song information and media events
  let currentSong: SongInfo | null = null

  const extractSongInfo = (): SongInfo | null => {
    try {
      // Get video element for duration and current time
      const videoElement = document.querySelector('#song-video video') as HTMLVideoElement
      if (!videoElement) return null

      const title =
        document.querySelector('.ytmusic-player-bar .title')?.textContent || 'Unknown Title'
      const artistLine =
        document.querySelector('.ytmusic-player-bar .byline')?.textContent?.split('•') || null
      const artist = artistLine ? artistLine[0].trim() : 'Unknown Artist'
      const album = artistLine ? artistLine[1].trim() : 'Unknown Album'

      // Get album art
      const albumArtElement = document.querySelector('#song-image #img') as HTMLImageElement
      const albumArt = albumArtElement?.src || ''

      const progressBar = document.querySelector('#progress-bar') as HTMLDivElement

      let durationTime = 0
      let currentTimeElapsed = 0

      if (progressBar) {
        durationTime = parseInt(progressBar.getAttribute('aria-valuemax')!) || 0
        currentTimeElapsed = parseInt(progressBar.getAttribute('aria-valuenow')!) || 0
      }

      const song = {
        title,
        artist,
        album,
        albumArt,
        duration: durationTime,
        currentTime: currentTimeElapsed
      }

      return song
    } catch (error) {
      console.error('Failed to extract song info:', error)
      return null
    }
  }

  const sendSongUpdate = (songInfo: SongInfo, state: 'playing' | 'paused') => {
    ipcRenderer.sendToHost('youtube:song-update', { songInfo, state })
  }

  let songCheckInterval

  const checkForSongChanges = () => {
    const newSong = extractSongInfo()
    if (!newSong) return

    // Check if song has changed
    if (
      !currentSong ||
      currentSong.title !== newSong.title ||
      currentSong.artist !== newSong.artist
    ) {
      currentSong = newSong

      // Check if media is playing
      const videoElement = document.querySelector('#song-video video') as HTMLVideoElement
      if (videoElement && !videoElement.paused) {
        sendSongUpdate(currentSong, 'playing')
      }
    } else {
      // If the song is the same just stop the interval
      clearInterval(songCheckInterval)
    }
  }

  // Listen for media events
  const attachMediaListeners = () => {
    const videoElement = document.querySelector('#song-video video') as HTMLVideoElement
    if (!videoElement) {
      // Retry after a short delay if video element not found
      setTimeout(attachMediaListeners, 1000)
      return
    }

    videoElement.addEventListener('play', () => {
      const songInfo = extractSongInfo()
      if (songInfo) {
        currentSong = songInfo
        sendSongUpdate(songInfo, 'playing')

        songCheckInterval = setInterval(checkForSongChanges, 1000)
      }
    })

    videoElement.addEventListener('pause', () => {
      if (currentSong) {
        sendSongUpdate(currentSong, 'paused')
      }
    })

    videoElement.addEventListener('seeked', () => {
      if (currentSong) {
        const progressBar = document.querySelector('#progress-bar') as HTMLDivElement
        currentSong.currentTime = parseInt(progressBar.getAttribute('aria-valuenow')!) || 0
        console.log('Seeked to:', currentSong.currentTime)
        sendSongUpdate(currentSong, 'playing')
      }
    })
  }

  // Start monitoring for media changes
  attachMediaListeners()

  const observeSongChanges = () => {
    const playerBar = document.getElementById('progress-bar')
    if (!playerBar) {
      setTimeout(observeSongChanges, 1000)
      return
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'aria-valuenow' || mutation.attributeName === 'aria-valuemax')
        ) {
          const songPlaying = extractSongInfo()
          if (songPlaying && currentSong && currentSong.title !== songPlaying.title) {
            currentSong = songPlaying
            setTimeout(() => {
              const newSong = extractSongInfo()!
              currentSong = newSong
              sendSongUpdate(currentSong, 'playing')
              console.log('Song changed observed:', currentSong.title, 'by', currentSong.artist)
            }, 1000) // Delay to ensure the DOM is updated
          }
        }
      })
    })

    observer.observe(playerBar, {
      attributes: true,
      attributeFilter: ['aria-valuenow', 'aria-valuemax']
    })
  }

  observeSongChanges()

  // Media control functions
  const playPause = () => {
    const playButton = document.getElementById('play-pause-button') as HTMLButtonElement
    if (playButton) {
      playButton.click()
    }
  }

  const nextTrack = () => {
    const nextButton = document.querySelector(
      '.next-button, [data-id="next-button"]'
    ) as HTMLButtonElement
    if (nextButton) {
      nextButton.click()
    }
  }

  const previousTrack = () => {
    const prevButton = document.querySelector(
      '.previous-button, [data-id="previous-button"]'
    ) as HTMLButtonElement
    if (prevButton) {
      prevButton.click()
    }
  }

  // Listen for media key events from main process
  ipcRenderer.on('media:play-pause', playPause)
  ipcRenderer.on('media:next-track', nextTrack)
  ipcRenderer.on('media:previous-track', previousTrack)
})
