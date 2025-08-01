import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { useEffect, useState } from 'react'

function PermissionsDialog() {
  const [displayDialog, setDisplayDialog] = useState(false)
  const [disabledRestart, setDisabledRestart] = useState(true)

  useEffect(() => {
    const handlePermissionDialog = () => {
      setDisplayDialog(true)
    }

    window.electron.ipcRenderer.on(
      'invoke-mac-accessibility-warning-dialog',
      handlePermissionDialog
    )

    return () => {
      window.electron.ipcRenderer.removeAllListeners('invoke-mac-accessibility-warning-dialog')
    }
  }, [])

  const handleGrantPermission = async () => {
    setDisabledRestart(false)
    await window.electron.ipcRenderer.invoke('request-mac-accessibility-warning-dialog')
  }

  const handleRestartApp = async () => {
    setDisplayDialog(false)
    await window.electron.ipcRenderer.invoke('restart-app')
  }

  return (
    <Dialog open={displayDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accessibility Permission Required</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <span className="flex flex-col gap-3">
            <span>
              Yumu requires accessibility permissions to be able to access media keys and other
              functionality in this computer.
            </span>
            <span>
              Once you grant permission, you will need to restart the app for the changes to take
              effect.
            </span>
          </span>
        </DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => handleGrantPermission()}>Grant Permission</Button>
          <Button onClick={() => handleRestartApp()} disabled={disabledRestart} variant="outline">
            Close App
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default PermissionsDialog
