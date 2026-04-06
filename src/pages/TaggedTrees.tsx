import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, TreePine, LocateFixed, FileText, AlertTriangle, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&q=80"

export default function TaggedTrees() {
  const { sites, setActiveSite, openReport, deleteTree, fetchSites, isLoading } = useAppStore()
  const navigate = useNavigate()

  const handleLocate = (site: any) => {
    setActiveSite(site)
    navigate('/')
  }

  // Filter out clearly invalid entries (zero/invalid coordinates)
  const validSites = sites.filter(s => {
    const hasValidCoords = s.lat !== 0 && s.lng !== 0 && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180
    return hasValidCoords
  })

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 border-b pb-4 mt-2">
        <div className="bg-primary/20 p-2.5 rounded-xl">
          <TreePine className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tagged Trees Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">A complete database view of all monitored trees mapped.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSites} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Badge variant="secondary" className="text-sm px-3 py-1">{validSites.length} trees</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {validSites.map(site => {
          const imageUrl = site.imageUrl && !site.imageUrl.includes('keyboard') ? site.imageUrl : FALLBACK_IMAGE
          const dbh = site.dbh_cm || (site.areaSize?.replace(' cm DBH', '')) || '—'
          const dbhNumber = Number.parseFloat(String(dbh))
          const needsCut = Number.isFinite(dbhNumber) && dbhNumber >= 30
          const survival = site.treeSurvivalRate ?? 0
          const isOffline = site.status !== 'Active'

          return (
            <div key={site.id} className={`bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group ${needsCut ? 'border-red-500/80 hover:border-red-500' : 'border-border hover:border-primary/40'}`}>
              {/* Photo */}
              <div className="relative h-44 w-full overflow-hidden rounded-xl">
                <img
                  src={imageUrl}
                  alt={site.name}
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE }}
                  className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <Badge
                  variant={isOffline ? 'destructive' : 'default'}
                  className={`absolute top-3 left-3 shadow-md text-xs ${!isOffline ? 'bg-green-600 text-white' : ''}`}
                >
                  {isOffline ? 'Offline' : 'Active'}
                </Badge>
                {needsCut && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-md">
                    Needs Cut
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex-1 space-y-3">
                <div>
                  <h3 className="font-bold text-base leading-tight truncate" title={site.name}>{site.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate" title={site.treeNum || site.id}>
                    #{site.treeNum || site.id.substring(0, 12)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 p-2.5 rounded-lg flex flex-col">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">DBH (cm)</span>
                    <span className="font-bold text-sm truncate" title={String(dbh)}>{dbh}</span>
                  </div>
                  <div className="bg-muted/50 p-2.5 rounded-lg flex flex-col">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Survival</span>
                    <span className={`font-bold text-sm ${survival >= 50 ? 'text-green-500' : survival > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {survival}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{site.lat.toFixed(5)}, {site.lng.toFixed(5)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 pb-4 flex gap-2">
                <Button
                  onClick={() => openReport(site)}
                  className="flex-1 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
                >
                  <FileText className="h-3.5 w-3.5" /> View Details
                </Button>
                <Button
                  onClick={() => handleLocate(site)}
                  variant="outline"
                  className="flex-1 text-xs gap-1.5 h-9"
                >
                  <LocateFixed className="h-3.5 w-3.5" /> Locate
                </Button>
                <Button
                  onClick={() => deleteTree(site.id)}
                  variant="destructive"
                  className="h-9 px-3"
                  aria-label={`Delete ${site.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}

        {validSites.length === 0 && (
          <div className="col-span-full py-24 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No tagged trees found in the database.</p>
          </div>
        )}
      </div>
    </div>
  )
}
