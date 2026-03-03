import { closeWindow, maximizeWindow, minimizeWindow } from '@ipc/helpers/window'
import Settings from '@renderer/components/Settings'
import { Button } from '@renderer/components/ui/button'
import { MinusIcon, SquareIcon, XIcon } from 'lucide-react'

const isMac = window.electron.process.platform === 'darwin'

function MacWindowControls() {
  return (
    <div className="ms-2 flex shrink-0 items-center gap-1.5">
      <Button
        size="icon-sm"
        variant="secondary"
        className="group size-3.5 rounded-full"
        onClick={closeWindow}
        aria-label="Close"
      >
        <XIcon className="size-2 opacity-0 transition-opacity group-hover:opacity-100" />
      </Button>
      <Button
        size="icon-sm"
        variant="secondary"
        className="group size-3.5 rounded-full"
        onClick={minimizeWindow}
        aria-label="Minimize"
      >
        <MinusIcon className="size-2 opacity-0 transition-opacity group-hover:opacity-100" />
      </Button>
      <Button
        size="icon-sm"
        variant="secondary"
        className="group size-3.5 rounded-full"
        onClick={maximizeWindow}
        aria-label="Maximize"
      >
        <SquareIcon className="size-2 opacity-0 transition-opacity group-hover:opacity-100" />
      </Button>
    </div>
  )
}

function ApplicationToolbar() {
  return (
    <div className="bg-primary fixed top-0 left-0 z-50 flex h-10 w-full items-center justify-between">
      {isMac && <MacWindowControls />}
      <div className="title-bar relative z-1 ms-3 flex h-full grow items-center select-none">
        <h1 className="text-primary-foreground text-sm font-semibold">
          Yumu / Unofficial YouTube Music Desktop Player
        </h1>
      </div>
      <div className="me-2 flex h-full grow-0 items-center">
        <Settings />
      </div>
      {!isMac && (
        <div className="me-2 flex grow-0 items-center gap-1">
          <Button size="icon-sm" variant="ghost" onClick={minimizeWindow}>
            <span className="sr-only">Minimize</span>
            <MinusIcon className="size-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={maximizeWindow}>
            <span className="sr-only">Maximize</span>
            <SquareIcon className="size-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={closeWindow}>
            <span className="sr-only">Close</span>
            <XIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default ApplicationToolbar
