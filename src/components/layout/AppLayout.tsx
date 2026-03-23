import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { useAppStore } from "@/store/useAppStore"
import { TreeReportModal } from "@/components/widgets/TreeReportModal"
import { useEffect } from "react"

export function AppLayout() {
  const { isSidebarOpen, fetchSites, fetchTagAreas, fetchRangers } = useAppStore()

  useEffect(() => {
    fetchSites()
    fetchTagAreas()
    fetchRangers()
  }, [fetchSites, fetchTagAreas, fetchRangers])

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 relative h-screen overflow-y-auto ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <Outlet />
      </main>
      <TreeReportModal />
    </div>
  )
}
