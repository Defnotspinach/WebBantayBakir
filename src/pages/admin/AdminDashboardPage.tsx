import { useCallback, useEffect, useMemo, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { isAdminEmail } from "@/lib/auth"
import { getConditionCodeLabel, getTreeStatusLabel, normalizeIsCut, resolveTreeConditionCodeFromData, type TreeConditionCode } from "@/lib/treeCondition"
import { useToast } from "@/contexts/ToastContext"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Download } from "lucide-react"

interface DashboardStats {
  totalTrees: number
  treesNeedingCut: number
  cutTrees: number
  code1Trees: number
  code2Trees: number
  code3Trees: number
  totalAreas: number
  totalRangers: number
}

interface DashboardTreeRow {
  id: string
  name: string
  area: string
  dbh: number
  conditionCode: TreeConditionCode
  isCut: boolean
  status: string
}

type DashboardTreeFilter = "all" | "code1" | "code2" | "code3" | "cut"

async function getCollectionDocs(collectionName: "areas" | "tagAreas" | "rangers" | "users") {
  try {
    return await getDocs(collection(db, collectionName))
  } catch {
    return null
  }
}

function parseDbhValue(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const rowsPerPage = 5
  const [stats, setStats] = useState<DashboardStats>({
    totalTrees: 0,
    treesNeedingCut: 0,
    cutTrees: 0,
    code1Trees: 0,
    code2Trees: 0,
    code3Trees: 0,
    totalAreas: 0,
    totalRangers: 0,
  })
  const [treeRows, setTreeRows] = useState<DashboardTreeRow[]>([])
  const [activeFilter, setActiveFilter] = useState<DashboardTreeFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const [treesSnap, areasSnap, tagAreasSnap, rangersSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "trees")),
        getCollectionDocs("areas"),
        getCollectionDocs("tagAreas"),
        getCollectionDocs("rangers"),
        getCollectionDocs("users"),
      ])

      const mappedTrees: DashboardTreeRow[] = treesSnap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>
        const conditionCode = resolveTreeConditionCodeFromData(data)
        const isCut = normalizeIsCut(data.is_cut, data.isCut)
        const dbh = parseDbhValue(data.dbh_cm ?? data.dbh ?? data.DBH)
        const name = String(data.commonName || data.scientificName || data.treeNum || `Tree ${docSnap.id.slice(0, 8)}`)
        const area = String(data.zone || data.area || data.tagArea || "N/A")
        const status = isCut ? "Cut" : dbh >= 30 ? "Ready to Cut" : getTreeStatusLabel(conditionCode, isCut)

        return {
          id: docSnap.id,
          name,
          area,
          dbh,
          conditionCode,
          isCut,
          status,
        }
      })

      const totalTrees = mappedTrees.length
      const treesNeedingCut = mappedTrees.filter((tree) => tree.dbh >= 30 && !tree.isCut).length
      const cutTrees = mappedTrees.filter((tree) => tree.isCut).length
      const code1Trees = mappedTrees.filter((tree) => tree.conditionCode === 1).length
      const code2Trees = mappedTrees.filter((tree) => tree.conditionCode === 2).length
      const code3Trees = mappedTrees.filter((tree) => tree.conditionCode === 3).length
      const totalAreas = (areasSnap && !areasSnap.empty ? areasSnap.size : tagAreasSnap?.size) ?? 0

      const rangerKeys = new Set<string>()
      const upsertRangersFromSnap = (snap: typeof rangersSnap) => {
        if (!snap) return
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>
          const email = String(data.email || data.userEmail || data.emailAddress || "").trim().toLowerCase()
          const role = String(data.role || "").trim().toLowerCase()
          if (role === "admin") return
          if (isAdminEmail(email)) return
          const key = email ? `email:${email}` : `id:${docSnap.id}`
          rangerKeys.add(key)
        })
      }

      upsertRangersFromSnap(rangersSnap)
      upsertRangersFromSnap(usersSnap)

      setTreeRows(mappedTrees)
      setStats({
        totalTrees,
        treesNeedingCut,
        cutTrees,
        code1Trees,
        code2Trees,
        code3Trees,
        totalAreas,
        totalRangers: rangerKeys.size,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const cards = [
    { label: "Total Trees", value: stats.totalTrees },
    { label: "Trees Needing Cut", value: stats.treesNeedingCut },
    { label: "Cut Trees", value: stats.cutTrees },
    { label: "Code 1 Trees", value: stats.code1Trees },
    { label: "Code 2 Trees", value: stats.code2Trees },
    { label: "Code 3 Trees", value: stats.code3Trees },
    { label: "Total Areas", value: stats.totalAreas },
    { label: "Total Rangers", value: stats.totalRangers },
  ]

  const filteredTrees = useMemo(() => {
    if (activeFilter === "all") return treeRows
    if (activeFilter === "cut") return treeRows.filter((tree) => tree.isCut)

    return treeRows.filter((tree) => {
      if (tree.isCut) return false
      if (activeFilter === "code1") return tree.conditionCode === 1
      if (activeFilter === "code2") return tree.conditionCode === 2
      if (activeFilter === "code3") return tree.conditionCode === 3
      return true
    })
  }, [activeFilter, treeRows])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, treeRows.length])

  const totalPages = Math.max(1, Math.ceil(filteredTrees.length / rowsPerPage))
  const paginatedTrees = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredTrees.slice(startIndex, startIndex + rowsPerPage)
  }, [currentPage, filteredTrees, rowsPerPage])
  const emptyRowCount = Math.max(0, rowsPerPage - paginatedTrees.length)

  const getExportRows = () =>
    filteredTrees.map((tree) => ({
      "Tree ID": tree.id,
      Name: tree.name,
      Area: tree.area,
      "DBH (cm)": tree.dbh,
      "Condition Code": getConditionCodeLabel(tree.conditionCode),
      Status: tree.status,
    }))

  const handleExportExcel = () => {
    const rows = getExportRows()
    if (rows.length === 0) {
      toast({ title: "No data to export for the selected filter", variant: "error" })
      return
    }
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "DashboardTrees")
    XLSX.writeFile(workbook, `dashboard-trees-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleExportPdf = () => {
    const rows = getExportRows()
    if (rows.length === 0) {
      toast({ title: "No data to export for the selected filter", variant: "error" })
      return
    }
    const pdf = new jsPDF({ orientation: "landscape" })
    pdf.setFontSize(14)
    pdf.text("Dashboard Trees Export", 14, 14)
    autoTable(pdf, {
      startY: 20,
      head: [["Tree ID", "Name", "Area", "DBH (cm)", "Condition Code", "Status"]],
      body: rows.map((row) => [row["Tree ID"], row.Name, row.Area, row["DBH (cm)"], row["Condition Code"], row.Status]),
      styles: { fontSize: 8 },
    })
    pdf.save(`dashboard-trees-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6 pb-24">
      <div className="border-b pb-4 mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">System-wide summary for administrators.</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadStats()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-1" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-1" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{isLoading ? "..." : card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Trees Condition Overview</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeFilter === "all" ? "default" : "outline"} onClick={() => setActiveFilter("all")}>
              All
            </Button>
            <Button size="sm" variant={activeFilter === "code1" ? "default" : "outline"} onClick={() => setActiveFilter("code1")}>
              Code 1 (Good)
            </Button>
            <Button size="sm" variant={activeFilter === "code2" ? "default" : "outline"} onClick={() => setActiveFilter("code2")}>
              Code 2 (Damaged)
            </Button>
            <Button size="sm" variant={activeFilter === "code3" ? "default" : "outline"} onClick={() => setActiveFilter("code3")}>
              Code 3 (Poor/Dying)
            </Button>
            <Button size="sm" variant={activeFilter === "cut" ? "default" : "outline"} onClick={() => setActiveFilter("cut")}>
              Cut Trees
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>Tree ID / Name</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>DBH (cm)</TableHead>
                  <TableHead>Condition Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Loading trees...
                    </TableCell>
                  </TableRow>
                ) : filteredTrees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      No trees found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {paginatedTrees.map((tree) => (
                      <TableRow key={tree.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium truncate">{tree.name}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">{tree.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="truncate">{tree.area}</TableCell>
                        <TableCell>{tree.dbh > 0 ? tree.dbh : "N/A"}</TableCell>
                        <TableCell className="truncate">{getConditionCodeLabel(tree.conditionCode)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              tree.status === "Cut"
                                ? "bg-rose-700 text-white"
                                : tree.status === "Ready to Cut"
                                  ? "bg-red-600 text-white"
                                  : tree.status === "Monitor"
                                    ? "bg-amber-600 text-white"
                                    : "bg-green-600 text-white"
                            }
                          >
                            {tree.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {Array.from({ length: emptyRowCount }).map((_, index) => (
                      <TableRow key={`empty-row-${index}`} className="h-[73px]">
                        <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell>
                        <TableCell>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading && filteredTrees.length > 0 ? (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
