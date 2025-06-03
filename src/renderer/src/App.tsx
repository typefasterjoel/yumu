import { LOCAL_YUMU_UI_SETTING } from '@ipc/types'
import ApplicationToolbar from '@renderer/components/ApplicationToolbar'
import YouTubeView from '@renderer/components/YouTubeView'
import Yumu from '@renderer/Yumu'

function App(): React.JSX.Element {
  const customUiEnabled = localStorage.getItem(LOCAL_YUMU_UI_SETTING) === 'true'

  return (
    <main className="bg-primary relative z-0 h-screen w-screen overflow-hidden pt-10">
      <ApplicationToolbar />
      <div className="bg-primary relative flex h-full w-full items-center justify-center">
        {customUiEnabled && <Yumu />}
        <YouTubeView />
      </div>
    </main>
  )
}

export default App
