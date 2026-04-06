import { useEffect, useRef } from "react"
import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const toastedRef = useRef(false)

  useEffect(() => {
    if (isLoading || toastedRef.current) return
    if (!user) {
      toast({
        title: "Please log in to access this page",
        variant: "info",
      })
      toastedRef.current = true
      return
    }
    if (!isAdmin) {
      toast({
        title: "Unauthorized access",
        description: "You must be logged in as admin to access this",
        variant: "error",
      })
      toastedRef.current = true
    }
  }, [isLoading, isAdmin, toast, user])

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
