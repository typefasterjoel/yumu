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
    <aside className="border-border w-60 shrink-0 grow-0 border-r p-2">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
