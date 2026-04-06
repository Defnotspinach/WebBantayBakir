import { X, Camera, MapPin, Activity, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { getConditionCodeLabel, getTreeStatusLabel } from "@/lib/treeCondition"

export function SiteDetailPanel() {
  const { activeSite, setActiveSite, openReport } = useAppStore()

  if (!activeSite) return null
  const statusLabel = getTreeStatusLabel(activeSite.condition_code, activeSite.is_cut)

  return (
      <Card className="w-96 pointer-events-auto bg-background/95 backdrop-blur border-border shadow-xl animate-in slide-in-from-right-8 overflow-hidden flex flex-col">
        {/* Photo Header */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl">
          <img src={activeSite.imageUrl} alt={activeSite.name} className="w-full h-full object-cover object-center block" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
          <Button 
             variant="secondary" 
             size="icon" 
             className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-md bg-background/50 hover:bg-background/80 backdrop-blur-md" 
             onClick={() => setActiveSite(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-0">
          <CardHeader className="pb-4 pt-2 relative z-10 -mt-8">
            <div className="flex items-center gap-2 mb-1">
               <Badge variant={activeSite.status === 'Active' ? 'default' : 'destructive'} className="shadow-sm">
                 {activeSite.status}
               </Badge>
               <span className="bg-muted text-foreground px-2 py-1 rounded text-xs font-semibold">
                 {statusLabel}
               </span>
               <span className="text-xs text-muted-foreground bg-background/80 px-1 rounded">ID: {activeSite.id}</span>
            </div>
            <CardTitle className="text-xl leading-tight">{activeSite.name}</CardTitle>
            <CardDescription className="flex items-start gap-1 mt-1">
               <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> 
               <span className="truncate">{activeSite.lat.toFixed(6)}, {activeSite.lng.toFixed(6)}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col bg-muted/50 p-3 rounded-lg overflow-hidden">
                   <span className="text-muted-foreground mb-1 text-xs">DBH / Area Size</span>
                   <span className="font-semibold text-lg truncate" title={activeSite.areaSize}>{activeSite.areaSize}</span>
                </div>
                <div className="flex flex-col bg-muted/50 p-3 rounded-lg overflow-hidden">
                   <span className="text-muted-foreground mb-1 text-xs">Condition</span>
                   <span className="font-semibold text-sm truncate" title={getConditionCodeLabel(activeSite.condition_code)}>
                     {getConditionCodeLabel(activeSite.condition_code)}
                   </span>
                </div>
             </div>

             <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-2">
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <Activity className="h-4 w-4" /> Vol m³ / Cams
                   </div>
                   <span className="font-medium">{activeSite.cameraCount}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <Camera className="h-4 w-4" /> Last Patrol
                   </div>
                   <span className="font-medium">{activeSite.lastPatrol}</span>
                </div>
             </div>
             
             <Button 
                onClick={() => openReport(activeSite)}
                className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold"
             >
                <FileText className="h-4 w-4" /> View Full Report
             </Button>
          </CardContent>
        </div>
      </Card>
  )
}
