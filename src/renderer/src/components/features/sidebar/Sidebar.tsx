import { useSearchCommand } from "@renderer/components/features/search/use-search-command"
import { Button } from "@renderer/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip"
import { Link } from "@tanstack/react-router"
import { HomeIcon, LibraryIcon, SearchIcon, type LucideIcon } from "lucide-react"

type NavItem = {
  to: "/home" | "/library"
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: "/home", label: "Home", icon: HomeIcon },
  { to: "/library", label: "Library", icon: LibraryIcon }
]

export default function Sidebar() {
  const openSearch = useSearchCommand((s) => s.setOpen)

  return (
    <aside className="bg-primary fixed top-10 bottom-0 left-0 z-99 w-13 shrink-0 grow-0 p-2">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Tooltip key={to}>
            <TooltipTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  nativeButton={false}
                  render={
                    <Link to={to} className="data-[status=active]:bg-accent">
                      <Icon className="size-4" />
                      <span className="sr-only">{label}</span>
                    </Link>
                  }
                />
              }
            />
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
        <Button size="icon" variant="ghost" onClick={() => openSearch(true)}>
          <SearchIcon className="size-4" />
          <span className="sr-only">Search</span>
        </Button>
      </nav>
    </aside>
  )
}
