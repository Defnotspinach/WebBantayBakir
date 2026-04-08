import { create } from "zustand"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type UpdateData,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { isAdminEmail } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { normalizeConditionCode, normalizeIsCut, resolveTreeConditionCodeFromData, type TreeConditionCode } from "@/lib/treeCondition"
import { sanitizeAndValidatePayload } from "@/lib/security"

export interface Site {
  id: string
  name: string
  lat: number
  lng: number
  areaSize: string
  treeSurvivalRate: number
  cameraCount: number
  status: "Active" | "Offline"
  healthStatus?: number
  lastPatrol: string
  imageUrl?: string
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
  createdAt?: string
  notes?: string
  condition_code: TreeConditionCode
  is_cut: boolean
}

export interface TagArea {
  id: string
  name: string
  description: string
  polygon: { latitude: number; longitude: number }[]
  createdAt: string
  lastUpdated: string
  taggedTreesCount: number
  targetTreeCount: number
}

export interface Ranger {
  id: string
  name: string
  email: string
  role: string
  workerId: string
  verificationStatus: "verified" | "pending"
  status: "active" | "inactive"
  sourceCollection: "rangers" | "users"
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
  setSearchQuery: (queryValue: string) => void
  filterStatus: "All" | "Active" | "Offline"
  setFilterStatus: (status: "All" | "Active" | "Offline") => void
  sites: Site[]
  tagAreas: TagArea[]
  rangers: Ranger[]
  rangersCount: number
  isLoading: boolean
  deletingTreeIds: string[]
  deletingAreaIds: string[]
  fetchSites: () => Promise<void>
  fetchTagAreas: () => Promise<void>
  fetchRangers: () => Promise<void>
  createTree: (payload: Record<string, unknown>, userEmail?: string | null) => Promise<string>
  updateTree: (
    treeId: string,
    payload: Record<string, unknown>,
    userEmail?: string | null
  ) => Promise<void>
  createArea: (payload: Record<string, unknown>, userEmail?: string | null) => Promise<string>
  updateArea: (
    areaId: string,
    payload: Record<string, unknown>,
    userEmail?: string | null
  ) => Promise<void>
  deleteTree: (treeId: string, userEmail?: string | null) => Promise<void>
  deleteTagArea: (areaId: string, userEmail?: string | null) => Promise<void>
}

const parseTimestamp = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "seconds" in (value as Record<string, unknown>)) {
    const seconds = Number((value as { seconds?: number }).seconds ?? 0)
    return new Date(seconds * 1000).toISOString()
  }
  return ""
}

async function getTreesSnapshot() {
  try {
    return await getDocs(
      query(collection(db, "trees"), orderBy("createdAt", "desc"))
    )
  } catch {
    return getDocs(collection(db, "trees"))
  }
}

async function getAreasSnapshot() {
  try {
    const areasSnap = await getDocs(
      query(collection(db, "areas"), orderBy("createdAt", "desc"))
    )
    if (!areasSnap.empty) return { snap: areasSnap, collectionName: "areas" as const }
  } catch {
    // Ignore and fallback.
  }

  try {
    const fallbackSnap = await getDocs(
      query(collection(db, "tagAreas"), orderBy("createdAt", "desc"))
    )
    return { snap: fallbackSnap, collectionName: "tagAreas" as const }
  } catch {
    const fallbackSnap = await getDocs(collection(db, "tagAreas"))
    return { snap: fallbackSnap, collectionName: "tagAreas" as const }
  }
}

async function getCollectionSnapshot(collectionName: "rangers" | "users") {
  try {
    return await getDocs(query(collection(db, collectionName), orderBy("createdAt", "desc")))
  } catch {
    try {
      return await getDocs(collection(db, collectionName))
    } catch {
      return null
    }
  }
}

async function getRangersSnapshots() {
  const [rangersSnap, usersSnap] = await Promise.all([
    getCollectionSnapshot("rangers"),
    getCollectionSnapshot("users"),
  ])

  const snapshots: Array<{ sourceCollection: "rangers" | "users"; snap: NonNullable<typeof rangersSnap> }> = []
  if (rangersSnap) snapshots.push({ sourceCollection: "rangers", snap: rangersSnap })
  if (usersSnap) snapshots.push({ sourceCollection: "users", snap: usersSnap })
  return snapshots
}

function getRangerEmail(data: Record<string, unknown>, docId: string) {
  const readString = (value: unknown) => {
    const normalized = String(value || "").trim()
    return normalized
  }

  const candidates = [
    data.email,
    data.userEmail,
    data.user_email,
    data.email_address,
    data.contactEmail,
    data.contact_email,
    data.loginEmail,
    data.username,
    data.emailAddress,
    data.mail,
    data.Email,
    (data.profile as Record<string, unknown> | undefined)?.email,
    (data.auth as Record<string, unknown> | undefined)?.email,
  ]

  for (const candidate of candidates) {
    const normalized = readString(candidate)
    if (normalized && normalized.includes("@")) return normalized
  }

  // Last fallback: scan unknown keys for likely email-like values.
  for (const [key, value] of Object.entries(data)) {
    if (!key.toLowerCase().includes("email")) continue
    const normalized = readString(value)
    if (normalized && normalized.includes("@")) return normalized
  }

  if (docId.includes("@")) return docId.trim()
  return "N/A"
}

function getRangerRole(data: Record<string, unknown>) {
  const explicitAdminFlags = [data.isAdmin, data.admin, data.is_admin]
  if (explicitAdminFlags.some((flag) => flag === true)) return "admin"

  const profile = (data.profile as Record<string, unknown> | undefined) ?? {}

  const candidates = [
    data.role,
    data.userRole,
    data.accountRole,
    data.account_role,
    data.userType,
    data.user_type,
    data.type,
    data.position,
    data.designation,
    data.jobTitle,
    data.job_title,
    data.occupation,
    profile.role,
    profile.userRole,
    profile.accountRole,
    profile.type,
  ]

  for (const candidate of candidates) {
    const normalized = String(candidate || "").trim().toLowerCase()
    if (!normalized) continue
    if (["field_ranger", "forest_ranger", "ranger_user"].includes(normalized)) return "ranger"
    if (["forest officer", "forest_officer", "forester"].includes(normalized)) return "forester"
    if (["administrator", "superadmin", "super_admin"].includes(normalized)) return "admin"
    return normalized
  }

  return "ranger"
}

function getRangerWorkerId(data: Record<string, unknown>, docId: string) {
  const candidates = [
    data.workerId,
    data.workerID,
    data.worker_id,
    data.employeeId,
    data.employeeID,
    data.employee_id,
    data.staffId,
    data.staffID,
    data.staff_id,
    data.idNumber,
    data.id_number,
    data.rangerId,
    data.rangerID,
    data.ranger_id,
  ]

  for (const candidate of candidates) {
    const normalized = String(candidate || "").trim()
    if (normalized) return normalized
  }

  return docId
}

function getRangerVerificationStatus(data: Record<string, unknown>): "verified" | "pending" {
  const normalizedStatus = String(
    data.verificationStatus || data.verification_status || data.accountStatus || data.account_status || data.approvalStatus || data.approval_status || ""
  )
    .trim()
    .toLowerCase()

  if (["verified", "approved", "active", "accepted"].includes(normalizedStatus)) {
    return "verified"
  }

  if (["pending", "for_review", "for approval", "awaiting_approval", "unverified"].includes(normalizedStatus)) {
    return "pending"
  }

  const explicitVerifiedFlags = [data.verified, data.isVerified, data.is_verified]
  if (explicitVerifiedFlags.some((flag) => flag === true)) return "verified"

  const explicitPendingFlags = [data.pending, data.isPending, data.is_pending]
  if (explicitPendingFlags.some((flag) => flag === true)) return "pending"

  return "pending"
}

function mapTreeDoc(docSnap: QueryDocumentSnapshot<DocumentData>): Site | null {
  const data = docSnap.data()
  const lat = data.latitude
  const lng = data.longitude

  if (typeof lat !== "number" || typeof lng !== "number" || (lat === 0 && lng === 0)) {
    return null
  }

  const name = data.commonName || data.scientificName || data.treeNum || "Unknown Tree"
  const isCut = normalizeIsCut(data.is_cut, data.isCut)
  const conditionCode = resolveTreeConditionCodeFromData(data)
  const status = isCut ? "Offline" : "Active"
  const areaSize = data.dbh_cm ? `${data.dbh_cm} cm DBH` : "N/A"
  const treeSurvivalRate = isCut ? 0 : 100
  const cameraCount = data.volume_m3 ? Math.round(Number(data.volume_m3)) : 0
  const imageUrl =
    data.imageUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&q=80"

  const createdAt = parseTimestamp(data.createdAt)
  const lastPatrol = createdAt ? new Date(createdAt).toLocaleDateString() : "Recent"

  return {
    ...data,
    id: docSnap.id,
    name,
    lat,
    lng,
    status,
    healthStatus: typeof data.status === "number" ? data.status : undefined,
    areaSize,
    treeSurvivalRate,
    cameraCount,
    lastPatrol,
    imageUrl,
    createdAt,
    condition_code: conditionCode,
    is_cut: isCut,
  } as Site
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
  searchQuery: "",
  setSearchQuery: (queryValue) =>
    set({
      searchQuery: queryValue.slice(0, 120),
    }),
  filterStatus: "All",
  setFilterStatus: (status) => set({ filterStatus: status }),
  sites: [],
  tagAreas: [],
  rangers: [],
  rangersCount: 0,
  isLoading: false,
  deletingTreeIds: [],
  deletingAreaIds: [],
  fetchSites: async () => {
    set({ isLoading: true })
    try {
      const querySnapshot = await getTreesSnapshot()
      const sitesList: Site[] = []

      querySnapshot.forEach((docSnap) => {
        const mapped = mapTreeDoc(docSnap)
        if (mapped) sitesList.push(mapped)
      })

      set({ sites: sitesList, isLoading: false })
    } catch (error) {
      console.error("Error fetching trees:", error)
      set({ isLoading: false })
    }
  },
  fetchTagAreas: async () => {
    try {
      const { snap } = await getAreasSnapshot()
      const areas: TagArea[] = []
      snap.forEach((docSnap) => {
        const data = docSnap.data()
        areas.push({
          id: docSnap.id,
          name: data.name || "",
          description: data.description || "",
          polygon: data.polygon || [],
          createdAt: parseTimestamp(data.createdAt),
          lastUpdated: parseTimestamp(data.lastUpdated),
          taggedTreesCount: data.taggedTreesCount || 0,
          targetTreeCount: data.targetTreeCount || 0,
        })
      })
      set({ tagAreas: areas })
    } catch (error) {
      console.error("Error fetching areas: ", error)
    }
  },
  fetchRangers: async () => {
    try {
      const snapshots = await getRangersSnapshots()
      const seen = new Set<string>()
      const rangers: Ranger[] = []

      snapshots.forEach(({ sourceCollection, snap }) => {
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>
          const normalizedEmail = getRangerEmail(data, docSnap.id).trim().toLowerCase()
          const role = getRangerRole(data)

          if (role === "admin") return
          if (isAdminEmail(normalizedEmail)) return

          const dedupeKey =
            normalizedEmail && normalizedEmail !== "n/a"
              ? `email:${normalizedEmail}`
              : `${sourceCollection}:${docSnap.id}`
          if (seen.has(dedupeKey)) return
          seen.add(dedupeKey)

          const firstName = String(data.firstName || data.firstname || "").trim()
          const lastName = String(data.lastName || data.lastname || "").trim()
          const fullName = [firstName, lastName].filter(Boolean).join(" ")
          const name = String(data.name || data.displayName || fullName || "Unknown Ranger")

          rangers.push({
            id: docSnap.id,
            name,
            email: getRangerEmail(data, docSnap.id),
            role,
            workerId: getRangerWorkerId(data, docSnap.id),
            verificationStatus: getRangerVerificationStatus(data),
            status: data.status === "inactive" ? "inactive" : "active",
            sourceCollection,
          })
        })
      })

      rangers.sort((a, b) => a.name.localeCompare(b.name))

      const activeCount = rangers.filter((ranger) => ranger.status === "active").length
      set({ rangers, rangersCount: activeCount })
    } catch (error) {
      console.warn("Could not fetch rangers from Firestore collections.", error)
    }
  },
  createTree: async (payload, userEmail) => {
    const sanitizedPayload = sanitizeAndValidatePayload(payload)
    const data = {
      ...sanitizedPayload,
      condition_code: normalizeConditionCode(sanitizedPayload["condition_code"]),
      is_cut: normalizeIsCut(sanitizedPayload["is_cut"], sanitizedPayload["isCut"]),
      createdBy: userEmail ?? "unknown",
      createdAt: serverTimestamp(),
    }
    const created = await addDoc(collection(db, "trees"), data)
    await logAudit({
      action: "CREATE",
      entity: "tree",
      entityId: created.id,
      before: null,
      after: {
        ...data,
        createdAt: "serverTimestamp()",
      },
      userEmail: userEmail ?? null,
    })
    return created.id
  },
  updateTree: async (treeId, payload, userEmail) => {
    const sanitizedPayload = sanitizeAndValidatePayload(payload)
    const ref = doc(db, "trees", treeId)
    const beforeSnap = await getDoc(ref)
    const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
    const nextPayload = {
      ...sanitizedPayload,
      ...(Object.prototype.hasOwnProperty.call(sanitizedPayload, "condition_code")
        ? { condition_code: normalizeConditionCode(sanitizedPayload["condition_code"]) }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(sanitizedPayload, "is_cut") || Object.prototype.hasOwnProperty.call(sanitizedPayload, "isCut")
        ? {
            is_cut: normalizeIsCut(sanitizedPayload["is_cut"], sanitizedPayload["isCut"]),
            isCut: normalizeIsCut(sanitizedPayload["is_cut"], sanitizedPayload["isCut"]),
          }
        : {}),
    }
    await updateDoc(ref, nextPayload as UpdateData<DocumentData>)
    await logAudit({
      action: "UPDATE",
      entity: "tree",
      entityId: treeId,
      before: (beforeData as Record<string, unknown> | null) ?? null,
      after: nextPayload,
      userEmail: userEmail ?? null,
    })
  },
  createArea: async (payload, userEmail) => {
    const sanitizedPayload = sanitizeAndValidatePayload(payload)
    const data = {
      ...sanitizedPayload,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    }
    const created = await addDoc(collection(db, "areas"), data)
    await logAudit({
      action: "CREATE",
      entity: "area",
      entityId: created.id,
      before: null,
      after: {
        ...data,
        createdAt: "serverTimestamp()",
        lastUpdated: "serverTimestamp()",
      },
      userEmail: userEmail ?? null,
    })
    return created.id
  },
  updateArea: async (areaId, payload, userEmail) => {
    const sanitizedPayload = sanitizeAndValidatePayload(payload)
    const ref = doc(db, "areas", areaId)
    const beforeSnap = await getDoc(ref)
    const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
    const nextPayload = {
      ...sanitizedPayload,
      lastUpdated: serverTimestamp(),
    }
    await updateDoc(ref, nextPayload as UpdateData<DocumentData>)
    await logAudit({
      action: "UPDATE",
      entity: "area",
      entityId: areaId,
      before: (beforeData as Record<string, unknown> | null) ?? null,
      after: {
        ...nextPayload,
        lastUpdated: "serverTimestamp()",
      },
      userEmail: userEmail ?? null,
    })
  },
  deleteTree: async (treeId, userEmail) => {
    set((state) => ({ deletingTreeIds: [...state.deletingTreeIds, treeId] }))
    try {
      const docRef = doc(db, "trees", treeId)
      const snapshot = await getDoc(docRef)
      const beforeData = snapshot.exists() ? snapshot.data() : null

      await deleteDoc(docRef)
      await logAudit({
        action: "DELETE",
        entity: "tree",
        entityId: treeId,
        before: (beforeData as Record<string, unknown> | null) ?? null,
        after: null,
        userEmail: userEmail ?? null,
      })

      set((state) => ({
        sites: state.sites.filter((site) => site.id !== treeId),
        activeSite: state.activeSite?.id === treeId ? null : state.activeSite,
        activeReportSite: state.activeReportSite?.id === treeId ? null : state.activeReportSite,
      }))
    } finally {
      set((state) => ({
        deletingTreeIds: state.deletingTreeIds.filter((id) => id !== treeId),
      }))
    }
  },
  deleteTagArea: async (areaId, userEmail) => {
    set((state) => ({ deletingAreaIds: [...state.deletingAreaIds, areaId] }))
    try {
      let collectionName: "areas" | "tagAreas" = "areas"
      let docRef = doc(db, collectionName, areaId)
      let snapshot = await getDoc(docRef)
      if (!snapshot.exists()) {
        collectionName = "tagAreas"
        docRef = doc(db, collectionName, areaId)
        snapshot = await getDoc(docRef)
      }
      const beforeData = snapshot.exists() ? snapshot.data() : null

      await deleteDoc(docRef)
      await logAudit({
        action: "DELETE",
        entity: "area",
        entityId: areaId,
        before: (beforeData as Record<string, unknown> | null) ?? null,
        after: null,
        userEmail: userEmail ?? null,
      })

      set((state) => ({
        tagAreas: state.tagAreas.filter((area) => area.id !== areaId),
        activeTagArea: state.activeTagArea?.id === areaId ? null : state.activeTagArea,
      }))
    } finally {
      set((state) => ({
        deletingAreaIds: state.deletingAreaIds.filter((id) => id !== areaId),
      }))
    }
  },
}))
