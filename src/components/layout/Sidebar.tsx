import { Link, useLocation } from "react-router-dom"
import { Map, Settings, Menu, Search, TreePine, Layers, ShieldCheck } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, searchQuery, setSearchQuery, filterStatus, setFilterStatus } = useAppStore()
  const location = useLocation()

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b h-16">
        {isSidebarOpen && (
          <div className="flex items-center gap-2 font-bold text-xl text-primary drop-shadow-sm">
            <img src="/icon.png" alt="Bantay Bakir Logo" className="w-10 h-10 shrink-0" />
            <span>Bantay Bakir</span>
          </div>
        )}
        {!isSidebarOpen && (
          <img src="/icon.png" alt="Bantay Bakir Logo" className="mx-auto w-10 h-10 shrink-0" />
        )}
        {isSidebarOpen && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      {!isSidebarOpen && (
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4">
        {isSidebarOpen && (
          <div className="px-4 mb-6">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search locations..."
                className="pl-9 bg-background focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'All' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setFilterStatus('All')}
              >All</Button>
              <Button
                variant={filterStatus === 'Active' ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 text-xs ${filterStatus === 'Active' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                onClick={() => setFilterStatus('Active')}
              >Active</Button>
              <Button
                variant={filterStatus === 'Offline' ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 text-xs ${filterStatus === 'Offline' ? 'bg-destructive/90 hover:bg-destructive text-white' : ''}`}
                onClick={() => setFilterStatus('Offline')}
              >Offline</Button>
            </div>
          </div>
        )}

        <nav className="space-y-2 px-2 flex-1 mt-4">
          <Link to="/">
            <Button variant={location.pathname === '/' ? 'secondary' : 'ghost'} className={`w-full justify-start ${!isSidebarOpen && 'px-0 justify-center'}`}>
              <Map className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''} shrink-0`} />
              {isSidebarOpen && "Map View"}
            </Button>
          </Link>
          <Link to="/trees">
            <Button variant={location.pathname === '/trees' ? 'secondary' : 'ghost'} className={`w-full justify-start ${!isSidebarOpen && 'px-0 justify-center'}`}>
              <TreePine className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''} shrink-0`} />
              {isSidebarOpen && "Tagged Trees"}
            </Button>
          </Link>
          <Link to="/areas">
            <Button variant={location.pathname === '/areas' ? 'secondary' : 'ghost'} className={`w-full justify-start ${!isSidebarOpen && 'px-0 justify-center'}`}>
              <Layers className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''} shrink-0`} />
              {isSidebarOpen && "Areas"}
            </Button>
          </Link>
          <Link to="/rangers">
            <Button variant={location.pathname === '/rangers' ? 'secondary' : 'ghost'} className={`w-full justify-start ${!isSidebarOpen && 'px-0 justify-center'}`}>
              <ShieldCheck className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''} shrink-0`} />
              {isSidebarOpen && "Active Rangers"}
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant={location.pathname === '/settings' ? 'secondary' : 'ghost'} className={`w-full justify-start ${!isSidebarOpen && 'px-0 justify-center'}`}>
              <Settings className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
              {isSidebarOpen && "Settings"}
            </Button>
          </Link>
        </nav>
      </div>

      {isSidebarOpen && (
        <div className="p-4 border-t text-xs text-muted-foreground text-center">
          Bantay Bakir Admin Panel
        </div>
      )}
    </aside>
  )
}
