import {
  SET_AUDIO_DEVICE,
  MEDIA_PLAY_PAUSE,
  MEDIA_NEXT_TRACK,
  MEDIA_PREVIOUS_TRACK,
  MEDIA_STOP
} from '@ipc/types'
import { receiveYouTubeEvents } from '@ipc/youtube/receiver'
import { cn } from '@renderer/lib/utils'
import { Disc3Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const YOUTUBE_MUSIC_URL = 'https://music.youtube.com/'
const isDev = import.meta.env.DEV

function YouTubeView() {
  const youtube = useRef<Electron.WebviewTag>(null)
  const [webviewLoaded, setWebviewLoaded] = useState(false)
  const [youTubePreloadScript, setYouTubePreloadScript] = useState<string | undefined>(undefined)

  const loading = !webviewLoaded || !youTubePreloadScript

  useEffect(() => {
    const fetchPath = async () => {
      try {
        if (window.yumu) {
          const path = await window.yumu.getYoutubePreloadScriptPath()
          setYouTubePreloadScript(path)
        }
      } catch (error) {
        console.error('Failed to fetch YouTube preload script path:', error)
      }
    }
    fetchPath()
  }, [])

  useEffect(() => {
    if (!youTubePreloadScript) return

    const webview = youtube.current
    if (!webview) return

    const handleLoad = () => {
      setWebviewLoaded(true)
      if (isDev) {
        webview.openDevTools()
      }
    }

    const handleIPCMessageFromWebview = (event: Electron.IpcMessageEvent) => {
      receiveYouTubeEvents(event)
    }

    const handleSettingAudio = (_, deviceId: string) => {
      webview.send(SET_AUDIO_DEVICE, deviceId)
    }

    const handleMediaPlayPause = () => {
      webview.send(MEDIA_PLAY_PAUSE)
    }

    const handleMediaNext = () => {
      webview.send(MEDIA_NEXT_TRACK)
    }

    const handleMediaPrevious = () => {
      webview.send(MEDIA_PREVIOUS_TRACK)
    }

    const handleMediaStop = () => {
      webview.send(MEDIA_STOP)
    }

    webview.addEventListener('did-finish-load', handleLoad)
    webview.addEventListener('ipc-message', handleIPCMessageFromWebview)

    const cleanupAudioListener = window.electron.ipcRenderer.on(
      SET_AUDIO_DEVICE,
      handleSettingAudio
    )

    const cleanupMediaPlayPauseListener = window.electron.ipcRenderer.on(
      MEDIA_PLAY_PAUSE,
      handleMediaPlayPause
    )

    const cleanupMediaNextListener = window.electron.ipcRenderer.on(
      MEDIA_NEXT_TRACK,
      handleMediaNext
    )

    const cleanupMediaPreviousListener = window.electron.ipcRenderer.on(
      MEDIA_PREVIOUS_TRACK,
      handleMediaPrevious
    )

    const cleanupMediaStopListener = window.electron.ipcRenderer.on(MEDIA_STOP, handleMediaStop)

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad)
      webview.removeEventListener('ipc-message', handleIPCMessageFromWebview)
      cleanupAudioListener()
      cleanupMediaPlayPauseListener()
      cleanupMediaNextListener()
      cleanupMediaPreviousListener()
      cleanupMediaStopListener()
    }
  }, [youTubePreloadScript])

  return (
    <>
      {loading && (
        <Disc3Icon
          className={cn('animation-duration-[3s] size-20 animate-spin')}
          strokeWidth={1.5}
        />
      )}
      {youTubePreloadScript && (
        <webview
          ref={youtube}
          className={cn(
            'absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500',
            loading ? 'opacity-0' : 'opacity-100'
          )}
          src={YOUTUBE_MUSIC_URL}
          partition="persist:youtube"
          preload={youTubePreloadScript}
        />
      )}
    </>
  )
}
export default YouTubeView
