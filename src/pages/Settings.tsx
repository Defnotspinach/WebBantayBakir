import { useTheme } from "@/components/theme-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/useAppStore"

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { fetchSites, fetchTagAreas, fetchRangers } = useAppStore()

  const handleRefresh = async () => {
    await Promise.all([fetchSites(), fetchTagAreas(), fetchRangers()])
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the interface theme of the Bantay Bakir dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="flex flex-col space-y-1">
                <Label>Theme Preference</Label>
                <div className="text-sm text-muted-foreground">Select Light, Dark, or System mode.</div>
             </div>
             <div className="ml-auto flex gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Light</Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Dark</Button>
                <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>System</Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
