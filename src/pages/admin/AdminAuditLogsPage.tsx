import { useCallback, useEffect, useMemo, useState } from "react"
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { ChevronDown, ChevronUp } from "lucide-react"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface AuditLog {
  id: string
  action: "CREATE" | "UPDATE" | "DELETE"
  entity: "tree" | "area" | "ranger"
  entityId: string
  performedBy: string
  timestamp?: { seconds?: number }
  changes?: {
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
  }
}

const PAGE_SIZE = 20

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [actionFilter, setActionFilter] = useState<"ALL" | "CREATE" | "UPDATE" | "DELETE">("ALL")
  const [entityFilter, setEntityFilter] = useState<"ALL" | "tree" | "area" | "ranger">("ALL")
  const [emailSearch, setEmailSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)

  const baseConstraints = useMemo<QueryConstraint[]>(() => {
    const constraints: QueryConstraint[] = []

    if (actionFilter !== "ALL") constraints.push(where("action", "==", actionFilter))
    if (entityFilter !== "ALL") constraints.push(where("entity", "==", entityFilter))
    if (emailSearch.trim()) {
      constraints.push(where("performedBy", ">=", emailSearch.trim()))
      constraints.push(where("performedBy", "<=", `${emailSearch.trim()}\uf8ff`))
      constraints.push(orderBy("performedBy"))
    }
    constraints.push(orderBy("timestamp", "desc"))
    constraints.push(limit(PAGE_SIZE))
    return constraints
  }, [actionFilter, emailSearch, entityFilter])

  const fetchLogs = useCallback(
    async (append: boolean) => {
      setIsLoading(true)
      try {
        const constraints = [...baseConstraints]
        if (append && lastDoc) {
          constraints.push(startAfter(lastDoc))
        }
        const q = query(collection(db, "audit_logs"), ...constraints)
        const snap = await getDocs(q)

        const items = snap.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<AuditLog, "id">),
            }) as AuditLog
        )

        setLogs((current) => (append ? [...current, ...items] : items))
        setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null)
      } finally {
        setIsLoading(false)
      }
    },
    [baseConstraints, lastDoc]
  )

  useEffect(() => {
    setLastDoc(null)
    void fetchLogs(false)
  }, [fetchLogs])

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 border-b pb-4 mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track all admin actions across trees, areas, and rangers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="h-8 rounded-lg border bg-background px-2.5 text-sm"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value as typeof actionFilter)}
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select
          className="h-8 rounded-lg border bg-background px-2.5 text-sm"
          value={entityFilter}
          onChange={(event) => setEntityFilter(event.target.value as typeof entityFilter)}
        >
          <option value="ALL">All Entities</option>
          <option value="tree">Tree</option>
          <option value="area">Area</option>
          <option value="ranger">Ranger</option>
        </select>
        <Input
          placeholder="Search by email"
          value={emailSearch}
          onChange={(event) => setEmailSearch(event.target.value)}
        />
        <Button variant="outline" disabled={isLoading} onClick={() => void fetchLogs(false)}>
          {isLoading ? "Loading..." : "Apply"}
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <Fragment key={log.id}>
                <TableRow key={log.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setExpanded((prev) => (prev === log.id ? null : log.id))}
                    >
                      {expanded === log.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.entity}</TableCell>
                  <TableCell>{log.performedBy}</TableCell>
                  <TableCell>
                    {log.timestamp?.seconds
                      ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                      : "Pending"}
                  </TableCell>
                </TableRow>
                {expanded === log.id ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <pre className="overflow-auto rounded-lg bg-muted p-3">
                          {`Before:\n${JSON.stringify(log.changes?.before ?? null, null, 2)}`}
                        </pre>
                        <pre className="overflow-auto rounded-lg bg-muted p-3">
                          {`After:\n${JSON.stringify(log.changes?.after ?? null, null, 2)}`}
                        </pre>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => void fetchLogs(true)} disabled={isLoading || !lastDoc}>
          {isLoading ? "Loading..." : "Load More"}
        </Button>
      </div>
    </div>
  )
}
import { Fragment } from "react"
