import { X, Target, MapPin } from "lucide-react"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/useAppStore"

export function AreaDetailPanel() {
  const { activeTagArea, setActiveTagArea } = useAppStore()

  if (!activeTagArea) return null

  const treesInArea = activeTagArea.taggedTreesCount || 0;
  const targetTrees = activeTagArea.targetTreeCount || 100;
  const progressPercent = Math.min((treesInArea / targetTrees) * 100, 100);

  return (
    <Card className="w-96 pointer-events-auto bg-background/95 backdrop-blur border-border border-l-4 border-l-primary shadow-xl animate-in slide-in-from-right-8 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="relative p-6 pb-4 bg-muted/20 border-b">
        <Button 
           variant="secondary" 
           size="icon" 
           className="absolute right-4 top-4 h-8 w-8 rounded-full shadow-sm bg-background/50 hover:bg-background/80 backdrop-blur-md" 
           onClick={() => setActiveTagArea(null)}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-xl">
                <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl leading-tight">{activeTagArea.name}</CardTitle>
        </div>
        <CardDescription className="flex items-start gap-1 mt-1">
           <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" /> 
           <span className="text-xs text-muted-foreground break-all">{activeTagArea.polygon.length} boundary points mapped</span>
        </CardDescription>
      </div>

      <div className="overflow-y-auto flex-1 p-0">
        <CardContent className="space-y-6 pt-6 px-6">
           <div>
              <h4 className="text-sm font-semibold mb-2">Area Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{activeTagArea.description || "No specific logging details provided for this geographic area."}</p>
           </div>

           <div className="bg-muted/40 rounded-xl p-4 border space-y-4">
              <div className="flex items-center justify-between">
                 <h4 className="text-sm font-semibold">Tagging Progress</h4>
                 <span className="text-sm font-medium text-primary">{treesInArea} / {targetTrees} Trees</span>
              </div>
              
              <Progress value={progressPercent} className="h-3 bg-primary/20" />
              
              <p className="text-xs text-muted-foreground text-center">
                 {progressPercent >= 100 ? "Plantation target achieved for this zone!" : `Tracking active. Minimum ${targetTrees} tree density target.`}
              </p>
           </div>
           
           <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div className="flex flex-col border p-3 rounded-lg">
                 <span className="text-muted-foreground mb-1 text-[10px] uppercase font-bold">Created On</span>
                 <span className="font-medium text-xs break-all">{activeTagArea.createdAt ? new Date(activeTagArea.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
              <div className="flex flex-col border p-3 rounded-lg">
                 <span className="text-muted-foreground mb-1 text-[10px] uppercase font-bold">Last Updated</span>
                 <span className="font-medium text-xs break-all">{activeTagArea.lastUpdated ? new Date(activeTagArea.lastUpdated).toLocaleDateString() : 'Unknown'}</span>
              </div>
           </div>
        </CardContent>
      </div>
    </Card>
  )
}
