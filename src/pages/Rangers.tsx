import { useEffect } from "react"
import { ShieldCheck, Mail, UserRound } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Rangers() {
  const { rangers, rangersCount, fetchRangers } = useAppStore()

  useEffect(() => {
    fetchRangers()
  }, [fetchRangers])

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 border-b pb-4 mt-2">
        <div className="bg-primary/20 p-2.5 rounded-xl">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rangers Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">Ranger accounts with their real status values. Admin users are excluded.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRangers}>Refresh</Button>
        </div>
      </div>

      {rangers.length === 0 ? (
          <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            No ranger accounts found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rangers.map((ranger) => (
            <Card key={ranger.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="truncate" title={ranger.name}>{ranger.name}</span>
                  <Badge className={ranger.status === "active" ? "bg-green-600 text-white" : "bg-muted text-foreground"}>
                    {ranger.status}
                  </Badge>
                </CardTitle>
                <CardDescription className="font-mono text-xs">ID: {ranger.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate" title={ranger.email}>{ranger.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                  <span className="capitalize">{ranger.role}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
