import { useMemo, useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, TreePine, LocateFixed, FileText, AlertTriangle, Trash2, Scissors } from "lucide-react"
import { useNavigate } from "react-router-dom"
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
import { getConditionCodeLabel, getTreeStatusLabel } from "@/lib/treeCondition"

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&q=80"
type TreeFilter = "all" | "code1" | "code2" | "code3" | "cut"

export default function TaggedTrees() {
  const { sites, setActiveSite, openReport, deleteTree, fetchSites, updateTree, isLoading, deletingTreeIds } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<TreeFilter>("all")
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [pendingCut, setPendingCut] = useState<{ id: string; name: string } | null>(null)
  const [markingCutId, setMarkingCutId] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const validSites = useMemo(
    () =>
      sites.filter((site) => site.lat !== 0 && site.lng !== 0 && Math.abs(site.lat) <= 90 && Math.abs(site.lng) <= 180),
    [sites]
  )

  const filteredSites = useMemo(() => {
    if (activeFilter === "all") return validSites
    if (activeFilter === "cut") return validSites.filter((site) => site.is_cut)

    return validSites.filter((site) => {
      if (site.is_cut) return false
      if (activeFilter === "code1") return site.condition_code === 1
      if (activeFilter === "code2") return site.condition_code === 2
      if (activeFilter === "code3") return site.condition_code === 3
      return true
    })
  }, [activeFilter, validSites])

  const handleLocate = (site: (typeof filteredSites)[number]) => {
    setActiveSite(site)
    navigate("/")
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteTree(pendingDelete.id, user?.email)
      toast({ title: "Tree deleted successfully", variant: "success" })
      setPendingDelete(null)
    } catch {
      toast({ title: "Failed to delete tree", variant: "error" })
    }
  }

  const handleMarkAsCut = async () => {
    if (!pendingCut) return
    setMarkingCutId(pendingCut.id)
    try {
      await updateTree(
        pendingCut.id,
        {
          is_cut: true,
          isCut: true,
        },
        user?.email
      )
      await fetchSites()
      toast({ title: "Tree marked as cut", variant: "success" })
      setPendingCut(null)
    } catch {
      toast({ title: "Failed to update tree", variant: "error" })
    } finally {
      setMarkingCutId(null)
    }
  }

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
          <Button variant="outline" size="sm" onClick={() => void fetchSites()} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {filteredSites.length} trees
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={activeFilter === "all" ? "default" : "outline"} onClick={() => setActiveFilter("all")}>
          All
        </Button>
        <Button size="sm" variant={activeFilter === "code1" ? "default" : "outline"} onClick={() => setActiveFilter("code1")}>
          Code 1 (Good)
        </Button>
        <Button size="sm" variant={activeFilter === "code2" ? "default" : "outline"} onClick={() => setActiveFilter("code2")}>
          Code 2 (Damaged)
        </Button>
        <Button size="sm" variant={activeFilter === "code3" ? "default" : "outline"} onClick={() => setActiveFilter("code3")}>
          Code 3 (Poor/Dying)
        </Button>
        <Button size="sm" variant={activeFilter === "cut" ? "default" : "outline"} onClick={() => setActiveFilter("cut")}>
          Cut Trees
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredSites.map((site) => {
          const imageUrl = site.imageUrl && !site.imageUrl.includes("keyboard") ? site.imageUrl : FALLBACK_IMAGE
          const statusLabel = getTreeStatusLabel(site.condition_code, site.is_cut)
          const isOffline = site.status !== "Active"

          return (
            <div
              key={site.id}
              className={`bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group ${
                statusLabel === "Ready to Cut"
                  ? "border-red-500/80 hover:border-red-500"
                  : statusLabel === "Cut"
                    ? "border-rose-700/80 hover:border-rose-700"
                    : "border-border hover:border-primary/40"
              }`}
            >
              <div className="relative h-44 w-full overflow-hidden rounded-xl">
                <img
                  src={imageUrl}
                  alt={site.name}
                  onError={(event) => {
                    ;(event.target as HTMLImageElement).src = FALLBACK_IMAGE
                  }}
                  className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <Badge
                  variant={isOffline ? "destructive" : "default"}
                  className={`absolute top-3 left-3 shadow-md text-xs ${!isOffline ? "bg-green-600 text-white" : ""}`}
                >
                  {isOffline ? "Offline" : "Active"}
                </Badge>
                <span
                  className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold shadow-md text-white ${
                    statusLabel === "Ready to Cut"
                      ? "bg-red-600"
                      : statusLabel === "Cut"
                        ? "bg-rose-700"
                        : statusLabel === "Monitor"
                          ? "bg-amber-600"
                          : "bg-green-700"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-3">
                <div>
                  <h3 className="font-bold text-base leading-tight truncate" title={site.name}>
                    {site.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate" title={site.treeNum || site.id}>
                    #{site.treeNum || site.id.substring(0, 12)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 p-2.5 rounded-lg flex flex-col">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Condition</span>
                    <span className="font-bold text-sm truncate" title={getConditionCodeLabel(site.condition_code)}>
                      {getConditionCodeLabel(site.condition_code)}
                    </span>
                  </div>
                  <div className="bg-muted/50 p-2.5 rounded-lg flex flex-col">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Area</span>
                    <span className="font-bold text-sm truncate" title={site.zone || "N/A"}>
                      {site.zone || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {site.lat.toFixed(5)}, {site.lng.toFixed(5)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="truncate">Added by: {site.createdBy || "Unknown"}</p>
                  <p>Date: {site.createdAt ? new Date(site.createdAt).toLocaleString() : "Unknown"}</p>
                </div>
              </div>

              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                <Button onClick={() => openReport(site)} className="w-full h-10 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 justify-center">
                  <FileText className="h-3.5 w-3.5" /> View Details
                </Button>
                <Button onClick={() => handleLocate(site)} variant="outline" className="w-full h-10 text-xs gap-1.5 justify-center">
                  <LocateFixed className="h-3.5 w-3.5" /> Locate
                </Button>
                <Button
                  onClick={() => setPendingCut({ id: site.id, name: site.name })}
                  variant="outline"
                  disabled={site.is_cut || markingCutId === site.id}
                  className="w-full h-10 text-xs gap-1.5 justify-center"
                >
                  <Scissors className="h-3.5 w-3.5" /> {site.is_cut ? "Already Cut" : "Mark as Cut"}
                </Button>
                <Button
                  onClick={() => setPendingDelete({ id: site.id, name: site.name })}
                  variant="destructive"
                  disabled={deletingTreeIds.includes(site.id)}
                  className="w-full h-10 text-xs gap-1.5 justify-center"
                  aria-label={`Delete ${site.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          )
        })}

        {filteredSites.length === 0 && (
          <div className="col-span-full py-24 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No tagged trees found for this filter.</p>
          </div>
        )}
      </div>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tree</DialogTitle>
            <DialogDescription>Are you sure you want to delete this tree?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pendingDelete ? deletingTreeIds.includes(pendingDelete.id) : false} onClick={() => void handleDelete()}>
              {pendingDelete && deletingTreeIds.includes(pendingDelete.id) ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingCut)} onOpenChange={(open) => !open && setPendingCut(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Tree as Cut</DialogTitle>
            <DialogDescription>
              Confirm marking {pendingCut?.name || "this tree"} as cut. This updates Firestore immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingCut(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pendingCut ? markingCutId === pendingCut.id : false} onClick={() => void handleMarkAsCut()}>
              {pendingCut && markingCutId === pendingCut.id ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
