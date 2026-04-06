import { useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { AppLayout } from "./components/layout/AppLayout"
import Dashboard from "./pages/Dashboard"
import Settings from "./pages/Settings"
import TaggedTrees from "./pages/TaggedTrees"
import Areas from "./pages/Areas"
import SplashScreen from "@/components/SplashScreen"
import Rangers from "./pages/Rangers"

function AppContent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="bantay-bakir-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="trees" element={<TaggedTrees />} />
            <Route path="areas" element={<Areas />} />
            <Route path="rangers" element={<Rangers />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
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
