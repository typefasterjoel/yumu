import { SET_AUDIO_DEVICE } from '@ipc/types'
import { receiveYouTubeEvents } from '@ipc/youtube/receiver'
import { cn } from '@renderer/lib/utils'
import { Disc3Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const YOUTUBE_MUSIC_URL = 'https://music.youtube.com/'

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
      //webview.openDevTools() // TODO: Remove this in production
    }

    const handleIPCMessageFromWebview = (event: Electron.IpcMessageEvent) => {
      receiveYouTubeEvents(event)
    }

    const handleSettingAudio = (_, deviceId: string) => {
      webview.send(SET_AUDIO_DEVICE, deviceId)
    }

    webview.addEventListener('did-finish-load', handleLoad)
    webview.addEventListener('ipc-message', handleIPCMessageFromWebview)

    const cleanupAudioListener = window.electron.ipcRenderer.on(
      SET_AUDIO_DEVICE,
      handleSettingAudio
    )

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad)
      webview.removeEventListener('ipc-message', handleIPCMessageFromWebview)
      cleanupAudioListener()
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
