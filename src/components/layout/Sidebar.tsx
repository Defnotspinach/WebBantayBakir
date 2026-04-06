import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Map,
  Menu,
  Search,
  TreePine,
  Layers,
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  LogIn,
  LogOut,
} from "lucide-react"
import type { ComponentType } from "react"
import { useAppStore } from "@/store/useAppStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"

interface NavItem {
  label: string
  icon: ComponentType<{ className?: string }>
  to: string
  adminOnly?: boolean
}

const adminNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard", adminOnly: true },
  { label: "Trees", icon: TreePine, to: "/admin/trees", adminOnly: true },
  { label: "Areas", icon: Layers, to: "/admin/areas", adminOnly: true },
  { label: "Rangers", icon: ShieldCheck, to: "/admin/rangers", adminOnly: true }
]

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, searchQuery, setSearchQuery, filterStatus, setFilterStatus } = useAppStore()
  const { user, isAdmin, logout } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const handleRestrictedClick = () => {
    toast({
      title: "You must be logged in as admin to access this",
      variant: "info",
    })
  }

  const handleLogout = async () => {
    await logout()
    toast({ title: "Logged out", variant: "success" })
    navigate("/")
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300 ${isSidebarOpen ? "w-72" : "w-20"}`}>
      <div className="flex items-center justify-between p-4 border-b h-16">
        {isSidebarOpen ? (
          <div className="flex items-center gap-2 font-bold text-xl text-primary drop-shadow-sm">
            <img src="/icon.png" alt="Bantay Bakir Logo" className="w-10 h-10 shrink-0" />
            <span>Bantay Bakir</span>
          </div>
        ) : (
          <img src="/icon.png" alt="Bantay Bakir Logo" className="mx-auto w-10 h-10 shrink-0" />
        )}
        {isSidebarOpen ? (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      {!isSidebarOpen ? (
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto py-4">
        {isSidebarOpen ? (
          <div className="px-4 mb-6">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search locations..."
                className="pl-9 bg-background focus-visible:ring-primary"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "All" ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setFilterStatus("All")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "Active" ? "default" : "outline"}
                size="sm"
                className={`flex-1 text-xs ${filterStatus === "Active" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                onClick={() => setFilterStatus("Active")}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "Offline" ? "default" : "outline"}
                size="sm"
                className={`flex-1 text-xs ${filterStatus === "Offline" ? "bg-destructive/90 hover:bg-destructive text-white" : ""}`}
                onClick={() => setFilterStatus("Offline")}
              >
                Offline
              </Button>
            </div>
          </div>
        ) : null}

        <nav className="space-y-2 px-2 flex-1 mt-4">
          <Link to="/">
            <Button
              variant={location.pathname === "/" ? "secondary" : "ghost"}
              className={`w-full justify-start ${!isSidebarOpen ? "px-0 justify-center" : ""}`}
            >
              <Map className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""} shrink-0`} />
              {isSidebarOpen ? "Map" : null}
            </Button>
          </Link>

          {adminNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            const canAccess = !item.adminOnly || (user && isAdmin)

            if (!canAccess) {
              return (
                <Button
                  key={item.to}
                  variant="ghost"
                  className={`w-full justify-start text-muted-foreground opacity-70 hover:opacity-90 ${!isSidebarOpen ? "px-0 justify-center" : ""}`}
                  onClick={handleRestrictedClick}
                >
                  <Icon className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""} shrink-0`} />
                  {isSidebarOpen ? (
                    <span className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {!user ? (
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          (not logged in)
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </Button>
              )
            }

            return (
              <Link key={item.to} to={item.to}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isSidebarOpen ? "px-0 justify-center" : ""}`}
                >
                  <Icon className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""} shrink-0`} />
                  {isSidebarOpen ? item.label : null}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t space-y-2">
        {!user ? (
          <Link to="/login">
            <Button className={`w-full ${!isSidebarOpen ? "px-0 justify-center" : ""}`}>
              <LogIn className={`h-4 w-4 ${isSidebarOpen ? "mr-2" : ""}`} />
              {isSidebarOpen ? "Login" : null}
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            className={`w-full ${!isSidebarOpen ? "px-0 justify-center" : ""}`}
            onClick={() => void handleLogout()}
          >
            <LogOut className={`h-4 w-4 ${isSidebarOpen ? "mr-2" : ""}`} />
            {isSidebarOpen ? "Logout" : null}
          </Button>
        )}
        {isSidebarOpen ? (
          <div className="text-xs text-muted-foreground text-center">
            {isAdmin ? "Admin Session" : "Public View"}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
