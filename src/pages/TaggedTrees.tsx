import { useAppStore } from "@/store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Target, LocateFixed, TreePine, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function TaggedTrees() {
  const { sites, setActiveSite, openReport } = useAppStore()
  const navigate = useNavigate()

  const handleLocate = (site: any) => {
    setActiveSite(site)
    navigate('/')
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 border-b pb-4 mt-2">
         <div className="bg-primary/20 p-2.5 rounded-xl">
             <TreePine className="h-7 w-7 text-primary" />
         </div>
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Tagged Trees Directory</h1>
            <p className="text-muted-foreground mt-1 text-sm">A complete database view of all monitored trees mapped from Firebase.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sites.map(site => (
          <Card key={site.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border group hover:border-primary/50 flex flex-col">
            <div className="relative h-48 w-full overflow-hidden">
               <img 
                 src={site.imageUrl} 
                 alt={site.name} 
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
               <Badge 
                 variant={site.status === 'Active' ? 'default' : 'destructive'} 
                 className="absolute top-3 left-3 shadow-md"
               >
                 {site.status}
               </Badge>
            </div>
            
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-lg line-clamp-1" title={site.name}>{site.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs font-mono">
                #{site.treeNum || site.id.substring(0, 8)}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-4 space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="bg-muted/50 p-2 rounded flex flex-col">
                    <span className="text-muted-foreground mb-0.5">DBH</span>
                    <span className="font-semibold">{site.dbh_cm || 'N/A'}</span>
                 </div>
                 <div className="bg-muted/50 p-2 rounded flex flex-col">
                    <span className="text-muted-foreground mb-0.5">Survival</span>
                    <span className="font-semibold text-green-600 dark:text-green-500">{site.treeSurvivalRate}%</span>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                 <MapPin className="h-3.5 w-3.5 shrink-0" />
                 <span className="truncate">{site.lat.toFixed(5)}, {site.lng.toFixed(5)}</span>
              </div>
            </CardContent>

            <CardFooter className="px-5 pb-5 pt-0 mt-auto flex gap-2 w-full">
               <Button 
                  onClick={() => openReport(site)}
                  className="flex-1 text-xs justify-center gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 px-2"
               >
                  <FileText className="h-3.5 w-3.5" /> View Details
               </Button>
               <Button 
                  onClick={() => handleLocate(site)}
                  className="flex-1 text-xs justify-center gap-1.5 shadow-sm px-2"
                  variant="outline"
               >
                  <LocateFixed className="h-3.5 w-3.5" /> Locate
               </Button>
            </CardFooter>
          </Card>
        ))}

        {sites.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
             <Target className="h-10 w-10 mx-auto mb-3 opacity-20" />
             <p>No tagged trees found in the database.</p>
          </div>
        )}
      </div>
    </div>
  )
}
