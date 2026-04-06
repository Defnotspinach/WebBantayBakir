import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { useAppStore } from "@/store/useAppStore"
import { TreeReportModal } from "@/components/widgets/TreeReportModal"
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

export function AppLayout() {
  const { isSidebarOpen, fetchSites, fetchTagAreas, fetchRangers } = useAppStore()
  const { isAdmin } = useAuth()

  useEffect(() => {
    void fetchSites()
    void fetchTagAreas()
    if (isAdmin) {
      void fetchRangers()
    }
  }, [fetchSites, fetchTagAreas, fetchRangers, isAdmin])

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
