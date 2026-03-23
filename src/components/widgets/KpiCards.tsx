import { useState } from "react"
import { createPortal } from "react-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Trees, ShieldCheck, Activity, Info, Target, MapPin, X } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"

type ExplanationType = 'monitored' | 'rangers' | 'survival' | 'selected' | 'tagged' | 'target' | null;

export function KpiCards() {
  const { filterStatus, searchQuery, sites, activeTagArea, rangersCount } = useAppStore()
  const [activeExplanation, setActiveExplanation] = useState<ExplanationType>(null)

  // Dynamic calculations based on live data
  const filteredSites = sites.filter(s => {
    if (filterStatus !== 'All' && s.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (searchQuery && !s.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  })

  function renderExplanationModal() {
    if (!activeExplanation) return null;

    let title = "";
    let description = "";

    switch (activeExplanation) {
      case 'monitored':
        title = "Monitored Trees";
        description = "The precise count of visible tree logging sites actively represented on your map. It updates dynamically when you use the search or status filters.";
        break;
      case 'rangers':
        title = "Active Rangers";
        description = "The exact count of active field unit accounts created and saved in the Firebase database under the \"users\" collection.";
        break;
      case 'survival':
        title = "Avg. Tree Survival";
        description = "A real-time calculated math average summing the true survival rate of all currently filtered tree sites on your active map.";
        break;
      case 'selected':
        title = "Selected Area";
        description = "Displays the name of the currently active geographic polygon zone mapping you clicked on.";
        break;
      case 'tagged':
        title = "Tagged Trees";
        description = "Real-time count of currently registered logging entries recorded within this specific mapping boundary, pulled natively piece-by-piece from Firebase.";
        break;
      case 'target':
        title = "Target Trees";
        description = "The structural absolute quota of trees mandated for this specific planting region according to the database parameters.";
        break;
    }

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveExplanation(null)}>
        <div className="bg-card border shadow-2xl rounded-xl w-full max-w-sm p-6 pointer-events-auto shadow-primary/10" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 border-b pb-3">
             <h3 className="text-lg font-bold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> {title}
             </h3>
             <Button variant="ghost" size="icon" onClick={() => setActiveExplanation(null)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
             </Button>
          </div>
          
          <div className="text-sm text-foreground/80 leading-relaxed">
            <p>{description}</p>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // Active Map Area Metric Panel
  if (activeTagArea) {
    return (
      <div className="flex gap-4 pointer-events-auto">
        <Card className="w-64 bg-primary/5 backdrop-blur shadow-md border-primary/30 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setActiveExplanation('selected')}>
          <CardContent className="p-4 flex items-center gap-4 group">
            <div className="p-3 bg-primary/20 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">Selected Area <Info className="h-3 w-3 opacity-50" /></p>
              <h3 className="text-2xl font-bold tracking-tight truncate w-full" title={activeTagArea.name}>{activeTagArea.name}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="w-64 bg-background/95 backdrop-blur shadow-md border-primary/20 cursor-pointer hover:bg-muted transition-colors" onClick={() => setActiveExplanation('tagged')}>
          <CardContent className="p-4 flex items-center gap-4 group">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Trees className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">Tagged Trees <Info className="h-3 w-3 opacity-50" /></p>
              <h3 className="text-2xl font-bold tracking-tight">{activeTagArea.taggedTreesCount || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="w-64 bg-background/95 backdrop-blur shadow-md border-primary/20 cursor-pointer hover:bg-muted transition-colors" onClick={() => setActiveExplanation('target')}>
          <CardContent className="p-4 flex items-center gap-4 group">
            <div className="p-3 bg-purple-500/10 rounded-full text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">Target Trees <Info className="h-3 w-3 opacity-50" /></p>
              <h3 className="text-2xl font-bold tracking-tight">{activeTagArea.targetTreeCount || 0}</h3>
            </div>
          </CardContent>
        </Card>

        {renderExplanationModal()}
      </div>
    )
  }

  // Standard Overview Metric Panel
  const totalSites = filteredSites.length
  const avgSurvival = Math.round(filteredSites.reduce((acc, curr) => acc + (curr.treeSurvivalRate || 0), 0) / (totalSites || 1))

  return (
    <div className="flex gap-4 pointer-events-auto">
      <Card className="w-64 bg-background/95 backdrop-blur shadow-md border-primary/20 cursor-pointer hover:bg-muted transition-colors" onClick={() => setActiveExplanation('monitored')}>
        <CardContent className="p-4 flex items-center gap-4 group">
          <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Trees className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">Monitored Trees <Info className="h-3 w-3 opacity-50" /></p>
            <h3 className="text-2xl font-bold tracking-tight">{totalSites} <span className="text-sm text-muted-foreground font-normal">sites</span></h3>
          </div>
        </CardContent>
      </Card>

      <Card className="w-64 bg-background/95 backdrop-blur shadow-md border-primary/20 cursor-pointer hover:bg-muted transition-colors" onClick={() => setActiveExplanation('rangers')}>
        <CardContent className="p-4 flex items-center gap-4 group">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">Active Rangers <Info className="h-3 w-3 opacity-50" /></p>
            <h3 className="text-2xl font-bold tracking-tight">{rangersCount} <span className="text-sm text-muted-foreground font-normal">accounts</span></h3>
          </div>
        </CardContent>
      </Card>

      <Card className="w-64 bg-background/95 backdrop-blur shadow-md border-primary/20 cursor-pointer hover:bg-muted transition-colors" onClick={() => setActiveExplanation('survival')}>
        <CardContent className="p-4 flex items-center gap-4 group">
          <div className="p-3 bg-green-500/10 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">Avg. Survival <Info className="h-3 w-3 opacity-50" /></p>
            <h3 className="text-2xl font-bold tracking-tight">{avgSurvival}%</h3>
          </div>
        </CardContent>
      </Card>

      {renderExplanationModal()}
    </div>
  )
}
