import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '@/store/useAppStore'
import { useTheme } from '@/components/theme-provider'

// Custom SVG Icon (Tree/Leaf)
const createCustomIcon = (status: 'Active' | 'Offline', isSelected: boolean = false) => {
  const color = status === 'Active' ? '#22c55e' : '#ef4444' // Tailwind green-500 and red-500
  const glow = isSelected ? `drop-shadow(0 0 10px ${color})` : 'drop-shadow-md'
  const scale = isSelected ? 'scale-125' : 'scale-100'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="${isSelected ? '2' : '1.5'}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tree-pine w-8 h-8 transition-transform duration-300 ${scale}" style="filter: ${glow};">
       <path d="M17 14 12 2 7 14"/>
       <path d="M19 19 12 8 5 19"/>
       <path d="M12 19v3"/>
    </svg>`
  
  return L.divIcon({
    html: svg,
    className: 'custom-map-marker bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

export default function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const tagAreasRef = useRef<L.Polygon[]>([])
  const callbacksRef = useRef({ setActiveSite: (_: any) => {}, setActiveTagArea: (_: any) => {} })
  
  const { theme } = useTheme()
  const { setActiveSite, filterStatus, searchQuery, activeSite, sites, tagAreas, setActiveTagArea, activeTagArea } = useAppStore()

  // Keep callbacks ref current so the map init handler never goes stale
  callbacksRef.current = { setActiveSite, setActiveTagArea }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const tileUrl = isDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([14.5995, 120.9842], 6)
      L.tileLayer(tileUrl, { attribution: '' }).addTo(leafletMap.current)

      // Clear selections when clicking the map background (not a marker/polygon)
      leafletMap.current.on('click', () => {
         callbacksRef.current.setActiveSite(null)
         callbacksRef.current.setActiveTagArea(null)
      })
    }

    // Cleanup on unmount
    return () => {
      // Intentionally avoiding unmounting the map directly due to React concurrent behaviors
      // but in production we'd do: leafletMap.current?.remove()
    }
  }, []) // Empty deps for init only

  // Update tile layer if theme changes
  useEffect(() => {
    if (leafletMap.current) {
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.setUrl(tileUrl)
        }
      })
    }
  }, [tileUrl])

  // Update markers
  useEffect(() => {
    if (!leafletMap.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    const filteredSites = sites.filter(s => {
      if (filterStatus !== 'All' && s.status?.toLowerCase() !== filterStatus.toLowerCase()) return false
      if (searchQuery && !s.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

    filteredSites.forEach(site => {
      const isSelected = activeSite?.id === site.id;
      const marker = L.marker([site.lat, site.lng], { 
          icon: createCustomIcon(site.status, isSelected),
          zIndexOffset: isSelected ? 1000 : 0
        })
        .addTo(leafletMap.current!)
        .bindTooltip(`<b>${site.name}</b><br/><span style="color:gray;font-size:0.8rem">${site.status}</span>`, { direction: 'top', offset: [0, -32] })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e as any)
          setActiveSite(site)
        })
      markersRef.current.push(marker)
    })

    // Draw grid areas
    tagAreasRef.current.forEach(polygon => leafletMap.current?.removeLayer(polygon))
    tagAreasRef.current = []

    tagAreas.forEach(area => {
      if (!area.polygon || area.polygon.length === 0) return;
      
      const latLngs = area.polygon.map(p => [p.latitude, p.longitude] as [number, number]);
      const polygon = L.polygon(latLngs, {
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '5, 5'
      })
      .bindTooltip(`<b>${area.name}</b><br/><span style="color:gray;font-size:0.8rem">${area.description}</span>`, { direction: 'center', permanent: false })
      .on('click', (e) => {
         L.DomEvent.stopPropagation(e as any)
         setActiveTagArea(area);
      })
      .addTo(leafletMap.current!);
      
      tagAreasRef.current.push(polygon);
    })

  }, [filterStatus, searchQuery, setActiveSite, activeSite, sites, tagAreas])

  // Pan & fit to active tag area when it changes (e.g. from Areas page Locate button)
  useEffect(() => {
    if (leafletMap.current && activeTagArea && activeTagArea.polygon?.length > 0) {
      const latLngs = activeTagArea.polygon.map(p => [p.latitude, p.longitude] as [number, number])
      const bounds = L.latLngBounds(latLngs)
      leafletMap.current.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1 })
    }
  }, [activeTagArea])

  // Update view when active site changes
  useEffect(() => {
    if (leafletMap.current && activeSite) {
      const currentZoom = leafletMap.current.getZoom();
      const targetZoom = Math.max(currentZoom, 16);
      leafletMap.current.setView([activeSite.lat, activeSite.lng], targetZoom, { animate: true, duration: 1 })
    }
  }, [activeSite])

  return <div ref={mapRef} className="w-full h-[100vh] z-[0]" />
}
