import { Button } from "@renderer/components/ui/button"
import { Link } from "@tanstack/react-router"
import { HomeIcon, SearchIcon, type LucideIcon } from "lucide-react"

type NavItem = {
  to: "/home" | "/search"
  label: string
  icon: LucideIcon
}

// Add entries here as routes land (home, library, ...).
const NAV_ITEMS: NavItem[] = [
  { to: "/home", label: "Home", icon: HomeIcon },
  { to: "/search", label: "Search", icon: SearchIcon }
]

export default function Sidebar() {
  return (
    <aside className="bg-primary fixed top-10 bottom-0 left-0 z-99 w-13 shrink-0 grow-0 p-2">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Button
            key={to}
            size="icon"
            variant="ghost"
            render={
              <Link to={to} className="data-[status=active]:bg-accent">
                <Icon className="size-4" />
                <span className="sr-only">{label}</span>
              </Link>
            }
          />
        ))}
      </nav>
    </aside>
  )
}
