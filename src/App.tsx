import { useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { AppLayout } from "./components/layout/AppLayout"
import Dashboard from "./pages/Dashboard"
import SplashScreen from "@/components/SplashScreen"
import TaggedTrees from "./pages/TaggedTrees"
import Areas from "./pages/Areas"
import Rangers from "./pages/Rangers"
import LoginPage from "./pages/LoginPage"
import PublicTreeDetailsPage from "./pages/PublicTreeDetailsPage"
import AdminDashboardPage from "./pages/admin/AdminDashboardPage"
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/contexts/ToastContext"

function AppContent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="bantay-bakir-theme">
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="tree/:id" element={<PublicTreeDetailsPage />} />

                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/trees"
                  element={
                    <ProtectedRoute>
                      <TaggedTrees />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/areas"
                  element={
                    <ProtectedRoute>
                      <Areas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/rangers"
                  element={
                    <ProtectedRoute>
                      <Rangers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/audit-logs"
                  element={
                    <ProtectedRoute>
                      <AdminAuditLogsPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="trees" element={<Navigate to="/admin/trees" replace />} />
                <Route path="areas" element={<Navigate to="/admin/areas" replace />} />
                <Route path="rangers" element={<Navigate to="/admin/rangers" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

function App() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />
  }

  return <AppContent />
}

export default App
