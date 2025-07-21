import { closeWindow, maximizeWindow, minimizeWindow } from '@ipc/helpers/window'
import Settings from '@renderer/components/Settings'
import { Button } from '@renderer/components/ui/button'
import { MinusIcon, SquareIcon, XIcon } from 'lucide-react'

function ApplicationToolbar() {
  return (
    <div className="bg-primary fixed top-0 left-0 z-50 flex h-10 w-full items-center justify-between gap-4">
      <div className="title-bar relative z-1 flex h-full grow items-center px-3 select-none">
        <h1 className="text-primary-foreground text-sm font-semibold">
          Yumu / Unofficial YouTube Music Desktop Player
        </h1>
      </div>
      <div className="flex h-full grow-0 items-center">
        <Settings />
      </div>
      <div className="mx-1 flex grow-0 items-center overflow-hidden rounded-md">
        <Button size="icon" variant="ghost" className="rounded-none" onClick={minimizeWindow}>
          <span className="sr-only">Minimize</span>
          <MinusIcon className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-none" onClick={maximizeWindow}>
          <span className="sr-only">Maximize</span>
          <SquareIcon className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-none" onClick={closeWindow}>
          <span className="sr-only">Close</span>
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
export default ApplicationToolbar
