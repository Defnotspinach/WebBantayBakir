import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, Target, Trees, Calendar, LocateFixed, Layers, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"

export default function Areas() {
  const { tagAreas, setActiveTagArea, deleteTagArea, fetchTagAreas, deletingAreaIds } = useAppStore()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchTagAreas()
      toast({ title: "Areas refreshed", variant: "success" })
    } catch {
      toast({ title: "Failed to refresh areas", variant: "error" })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLocate = (area: any) => {
    setActiveTagArea(area)
    navigate('/')
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteTagArea(pendingDelete.id, user?.email)
      toast({ title: "Area deleted successfully", variant: "success" })
      setPendingDelete(null)
    } catch {
      toast({ title: "Failed to delete area", variant: "error" })
    }
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 border-b pb-4 mt-2">
        <div className="bg-primary/20 p-2.5 rounded-xl">
          <Layers className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tagged Areas</h1>
          <p className="text-muted-foreground mt-1 text-sm">Geographic zones and plantation boundaries mapped.</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tagAreas.map(area => {
          const progress = area.targetTreeCount > 0
            ? Math.min((area.taggedTreesCount / area.targetTreeCount) * 100, 100)
            : 0
          const isComplete = progress >= 100

          return (
            <div
              key={area.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col group"
            >
              {/* Color Banner */}
              <div className="h-2 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

              <div className="p-5 flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight">{area.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{area.description || 'No description'}</p>
                    </div>
                  </div>
                  <Badge variant={isComplete ? 'default' : 'secondary'} className={`shrink-0 text-xs ${isComplete ? 'bg-green-600 text-white' : ''}`}>
                    {isComplete ? 'Complete' : 'Active'}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tagging Progress</span>
                    <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2.5" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/40 rounded-xl p-3 flex flex-col items-center border">
                    <Trees className="h-4 w-4 text-primary mb-1" />
                    <span className="text-xl font-bold">{area.taggedTreesCount || 0}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Tagged</span>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 flex flex-col items-center border">
                    <Target className="h-4 w-4 text-purple-500 mb-1" />
                    <span className="text-xl font-bold">{area.targetTreeCount || 0}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Target</span>
                  </div>
                </div>

                {/* Polygon Points */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{area.polygon?.length || 0} boundary points mapped</span>
                </div>

                {/* Dates */}
                {(area.createdAt || area.lastUpdated) && (
                  <div className="flex gap-3 pt-1 border-t text-xs text-muted-foreground">
                    {area.createdAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {new Date(area.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 flex gap-2">
                <Button
                  onClick={() => handleLocate(area)}
                  className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  <LocateFixed className="h-4 w-4" /> View on Map
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setPendingDelete({ id: area.id, name: area.name })}
                  disabled={deletingAreaIds.includes(area.id)}
                  className="px-3"
                  aria-label={`Delete ${area.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}

        {tagAreas.length === 0 && (
          <div className="col-span-full py-24 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No tagged areas found</p>
            <p className="text-sm mt-1">Areas will appear here once added to the Firebase database.</p>
          </div>
        )}
      </div>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Area</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this area?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pendingDelete ? deletingAreaIds.includes(pendingDelete.id) : false}
              onClick={() => void handleDelete()}
            >
              {pendingDelete && deletingAreaIds.includes(pendingDelete.id)
                ? "Deleting..."
                : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
