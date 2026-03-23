import { create } from 'zustand'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Site {
  id: string
  name: string
  lat: number
  lng: number
  areaSize: string
  treeSurvivalRate: number
  cameraCount: number
  status: 'Active' | 'Offline'
  lastPatrol: string
  imageUrl?: string // Optional image representation from Firebase
  dbh_cm?: string
  mh_m?: string
  volume_m3?: string
  stemQuality?: string
  scientificName?: string
  treeCategory?: string
  treeNum?: string
  zone?: string
  easting?: string
  northing?: string
  createdBy?: string
  notes?: string
}

export interface TagArea {
  id: string;
  name: string;
  description: string;
  polygon: { latitude: number; longitude: number }[];
  createdAt: string;
  lastUpdated: string;
  taggedTreesCount: number;
  targetTreeCount: number;
}

interface AppState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  activeSite: Site | null
  setActiveSite: (site: Site | null) => void
  activeTagArea: TagArea | null
  setActiveTagArea: (area: TagArea | null) => void
  activeReportSite: Site | null
  openReport: (site: Site) => void
  closeReport: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterStatus: 'All' | 'Active' | 'Offline'
  setFilterStatus: (status: 'All' | 'Active' | 'Offline') => void
  sites: Site[]
  tagAreas: TagArea[]
  rangersCount: number
  isLoading: boolean
  fetchSites: () => Promise<void>
  fetchTagAreas: () => Promise<void>
  fetchRangers: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  activeSite: null,
  setActiveSite: (site) => set({ activeSite: site, activeTagArea: null }),
  activeTagArea: null,
  setActiveTagArea: (area) => set({ activeTagArea: area, activeSite: null }),
  activeReportSite: null,
  openReport: (site) => set({ activeReportSite: site }),
  closeReport: () => set({ activeReportSite: null }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  filterStatus: 'All',
  setFilterStatus: (status) => set({ filterStatus: status }),
  sites: [],
  tagAreas: [],
  rangersCount: 0,
  isLoading: false,
  fetchSites: async () => {
    set({ isLoading: true });
    try {
      const querySnapshot = await getDocs(collection(db, "trees"));
      const sitesList: Site[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const lat = data.latitude;
        const lng = data.longitude;
        
        // Skip invalid points
        if (typeof lat !== 'number' || typeof lng !== 'number' || (lat === 0 && lng === 0)) {
           return; 
        }

        const name = data.commonName || data.scientificName || data.treeNum || "Unknown Tree";
        const status = data.isCut ? 'Offline' : 'Active';
        const areaSize = data.dbh_cm ? `${data.dbh_cm} cm DBH` : "N/A";
        const treeSurvivalRate = data.isCut ? 0 : 100;
        const cameraCount = data.volume_m3 ? Math.round(data.volume_m3) : 0;
        
        // Handle timestamps properly if they exist as Firebase Timestamps
        let lastPatrol = "Recent";
        if (data.createdAt && data.createdAt.seconds) {
           lastPatrol = new Date(data.createdAt.seconds * 1000).toLocaleDateString()
        } else if (typeof data.createdAt === 'string') {
           lastPatrol = new Date(data.createdAt).toLocaleDateString()
        }

        const imageUrl = data.imageUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&q=80"; // Fallback to a placeholder forest image if none provided

        sitesList.push({
          ...data,
          id: doc.id,
          name,
          lat,
          lng,
          status,
          areaSize,
          treeSurvivalRate,
          cameraCount,
          lastPatrol,
          imageUrl,
        } as unknown as Site);
      });
      set({ sites: sitesList, isLoading: false });
    } catch (error) {
      console.error("Error fetching trees:", error);
      set({ isLoading: false });
    }
  },
  fetchTagAreas: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tagAreas'));
      const areas: TagArea[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        areas.push({
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          polygon: data.polygon || [],
          createdAt: data.createdAt || '',
          lastUpdated: data.lastUpdated || '',
          taggedTreesCount: data.taggedTreesCount || 0,
          targetTreeCount: data.targetTreeCount || 0,
        });
      });
      set({ tagAreas: areas });
    } catch (error) {
      console.error("Error fetching tagAreas: ", error);
    }
  },
  fetchRangers: async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      set({ rangersCount: snap.size });
    } catch (error) {
      console.warn("Could not fetch rangers from 'users' collection.", error);
    }
  }
}))
