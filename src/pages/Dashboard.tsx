import { KpiCards } from "@/components/widgets/KpiCards"
import { SiteDetailPanel } from "@/components/widgets/SiteDetailPanel"
import InteractiveMap from "@/components/map/InteractiveMap"

export default function Dashboard() {
  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Top Floating KPI Cards */}
      <div className="absolute top-4 left-4 right-4 z-[400] pointer-events-none">
        <KpiCards />
      </div>

      {/* Main Map Background */}
      <div className="flex-1 w-full h-full z-0">
         <InteractiveMap />
      </div>

      {/* Floating Detail Panel (Right side) */}
      <div className="absolute top-24 right-4 z-[400] pointer-events-none">
        <SiteDetailPanel />
      </div>
    </div>
  )
}
