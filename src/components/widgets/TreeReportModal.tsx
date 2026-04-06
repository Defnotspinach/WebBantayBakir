import { createPortal } from 'react-dom'
import { X, Ruler, Leaf, Globe, Trash2 } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function TreeReportModal() {
  const { activeReportSite: activeSite, closeReport, deleteTree } = useAppStore()

  if (!activeSite) return null
  const dbhValue = Number.parseFloat(String(activeSite.dbh_cm ?? ""))
  const needsCut = Number.isFinite(dbhValue) && dbhValue >= 30

  return createPortal(
    <div 
       className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" 
       style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
       onClick={closeReport}
    >
      <div 
         className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto border animate-in zoom-in-95 duration-200"
         onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0">
           <div>
             <h2 className="text-2xl font-bold">Full Report: {activeSite.name}</h2>
             <p className="text-muted-foreground text-sm mt-1">Detailed record for tree #{activeSite.id}.</p>
           </div>
           <div className="flex items-center gap-2">
             <Button
               variant="destructive"
               size="sm"
               className="gap-1.5"
               onClick={() => deleteTree(activeSite.id)}
             >
               <Trash2 className="h-4 w-4" /> Delete
             </Button>
             <Button variant="ghost" size="icon" onClick={closeReport} className="rounded-full">
               <X className="h-5 w-5" />
             </Button>
           </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="overflow-hidden rounded-xl">
                <img src={activeSite.imageUrl} className="w-full h-64 object-cover block shadow-sm" alt={activeSite.name} />
              </div>
              <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Status Information</h3>
                 <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">
                      <Badge variant={activeSite.status === 'Active' ? 'default' : 'destructive'} className="shadow-sm">
                        {activeSite.status}
                      </Badge>
                    </span>
                    
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-medium break-all">{activeSite.lat.toFixed(6)}, {activeSite.lng.toFixed(6)}</span>
                    
                    <span className="text-muted-foreground">Survival Rate:</span>
                    <span className="font-medium text-green-600">{activeSite.treeSurvivalRate}%</span>
                    
                    <span className="text-muted-foreground">DBH (Area Size):</span>
                    <div className="font-medium flex items-center gap-2">
                      <span>{activeSite.areaSize}</span>
                      {needsCut && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                          Needs Cut
                        </span>
                      )}
                    </div>
                    
                    <span className="text-muted-foreground">Measurement m³:</span>
                    <span className="font-medium">{activeSite.cameraCount}</span>
                    
                    <span className="text-muted-foreground">Recording Date:</span>
                    <span className="font-medium">{activeSite.lastPatrol}</span>
                 </div>
              </div>
           </div>
           
           <div className="mt-8 border-t pt-6 mb-4">
              <h3 className="font-semibold text-lg mb-4">Detailed Tree Registry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Measurements Card */}
                <div className="bg-muted/30 border rounded-xl p-4">
                   <h4 className="font-semibold flex items-center gap-2 mb-3 border-b pb-2">
                      <Ruler className="h-4 w-4 text-primary" /> Physical Measurements
                   </h4>
                   <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">DBH (cm)</p><p className="font-medium">{activeSite.dbh_cm || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Height (m)</p><p className="font-medium">{activeSite.mh_m || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Volume (m³)</p><p className="font-medium">{activeSite.volume_m3 || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Stem Quality</p><p className="font-medium">{activeSite.stemQuality || 'N/A'}</p></div>
                   </div>
                </div>

                {/* Taxonomy Card */}
                <div className="bg-muted/30 border rounded-xl p-4">
                   <h4 className="font-semibold flex items-center gap-2 mb-3 border-b pb-2">
                      <Leaf className="h-4 w-4 text-primary" /> Taxonomy & Origin
                   </h4>
                   <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Scientific Name</p><p className="font-medium italic">{activeSite.scientificName || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Category</p><p className="font-medium capitalize">{activeSite.treeCategory || 'N/A'}</p></div>
                      <div className="col-span-2"><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Tree Number</p><p className="font-medium font-mono text-xs break-all">{activeSite.treeNum || activeSite.id}</p></div>
                   </div>
                </div>
                
                {/* Metadata Card */}
                <div className="bg-muted/30 border rounded-xl p-4 md:col-span-2">
                   <h4 className="font-semibold flex items-center gap-2 mb-3 border-b pb-2">
                      <Globe className="h-4 w-4 text-primary" /> Region & Metadata
                   </h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 text-sm">
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Zone</p><p className="font-medium">{activeSite.zone || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Easting</p><p className="font-medium">{activeSite.easting || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Northing</p><p className="font-medium">{activeSite.northing || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Created By</p><p className="font-medium truncate" title={activeSite.createdBy}>{activeSite.createdBy || 'Unknown'}</p></div>
                   </div>
                   {activeSite.notes && (
                     <div className="mt-3 pt-3 border-t">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Forester Notes</p>
                        <p className="text-sm bg-background p-2 rounded-lg border italic">{activeSite.notes}</p>
                     </div>
                   )}
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
