import { ipcRenderer } from 'electron'

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
})
