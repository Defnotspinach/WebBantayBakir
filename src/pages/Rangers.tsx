import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { Plus, ShieldCheck, Trash2 } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { db } from "@/lib/firebase"
import { isAdminEmail } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { assertValidEmail, SecurityValidationError, sanitizeText } from "@/lib/security"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type RangerStatus = "active" | "inactive"
type RangerSourceCollection = "rangers" | "users"

interface RangerFormState {
  id?: string
  sourceCollection?: RangerSourceCollection
  name: string
  email: string
  workerId: string
  role: string
  verificationStatus: "verified" | "pending"
  status: RangerStatus
}

interface PendingApprovalState {
  id: string
  name: string
  sourceCollection: RangerSourceCollection
  selectedRole: "forester" | "admin"
}

const initialForm: RangerFormState = {
  name: "",
  email: "",
  workerId: "",
  role: "ranger",
  verificationStatus: "pending",
  status: "active",
}

export default function Rangers() {
  const { rangers, fetchRangers } = useAppStore()
  const { user } = useAuth()
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | RangerStatus>("all")
  const [formState, setFormState] = useState<RangerFormState>(initialForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; sourceCollection: RangerSourceCollection } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState<PendingApprovalState | null>(null)

  useEffect(() => {
    void fetchRangers()
  }, [fetchRangers])

  const filtered = useMemo(() => {
    return rangers.filter((ranger) => {
      if (statusFilter !== "all" && ranger.status !== statusFilter) return false
      if (!search.trim()) return true
      const query = search.toLowerCase()
      return (
        ranger.name.toLowerCase().includes(query) ||
        ranger.email.toLowerCase().includes(query)
      )
    })
  }, [rangers, search, statusFilter])

  const openCreate = () => {
    setFormState(initialForm)
    setIsFormOpen(true)
  }

  const openEdit = (ranger: RangerFormState) => {
    setFormState(ranger)
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!formState.name.trim() || !formState.email.trim()) {
      toast({ title: "Name and email are required", variant: "error" })
      return
    }

    setIsSubmitting(true)
    try {
      const sanitizedName = sanitizeText(formState.name, 120)
      const sanitizedEmail = assertValidEmail(formState.email)
      const sanitizedWorkerId = sanitizeText(formState.workerId, 50)
      const sanitizedRole = sanitizeText(formState.role || "ranger", 30).toLowerCase()

      if (!sanitizedName || !sanitizedEmail) {
        throw new SecurityValidationError("Name and email are required")
      }

      if (isAdminEmail(sanitizedEmail)) {
        throw new SecurityValidationError("Admin accounts are excluded from ranger records")
      }

      if (formState.id) {
        const targetCollection = formState.sourceCollection ?? "rangers"
        const ref = doc(db, targetCollection, formState.id)
        const beforeSnap = await getDoc(ref)
        const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
        const afterData = {
          name: sanitizedName,
          email: sanitizedEmail,
          workerId: sanitizedWorkerId,
          role: sanitizedRole || "ranger",
          verificationStatus: formState.verificationStatus,
          verified: formState.verificationStatus === "verified",
          status: formState.status,
        }
        await updateDoc(ref, afterData)
        await logAudit({
          action: "UPDATE",
          entity: "ranger",
          entityId: formState.id,
          before: (beforeData as Record<string, unknown> | null) ?? null,
          after: afterData,
          userEmail: user?.email,
        })
        toast({ title: "Ranger updated successfully", variant: "success" })
      } else {
        const afterData = {
          name: sanitizedName,
          email: sanitizedEmail,
          workerId: sanitizedWorkerId,
          role: sanitizedRole || "ranger",
          verificationStatus: formState.verificationStatus,
          verified: formState.verificationStatus === "verified",
          status: formState.status,
          createdAt: serverTimestamp(),
        }
        const created = await addDoc(collection(db, "rangers"), afterData)
        await logAudit({
          action: "CREATE",
          entity: "ranger",
          entityId: created.id,
          before: null,
          after: {
            ...afterData,
            createdAt: "serverTimestamp()",
          },
          userEmail: user?.email,
        })
        toast({ title: "Ranger created successfully", variant: "success" })
      }

      setIsFormOpen(false)
      setFormState(initialForm)
      await fetchRangers()
    } catch (error) {
      const message =
        error instanceof SecurityValidationError
          ? error.message
          : "Failed to save ranger"
      toast({ title: message, variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    try {
      const ref = doc(db, pendingDelete.sourceCollection, pendingDelete.id)
      const beforeSnap = await getDoc(ref)
      const beforeData = beforeSnap.exists() ? beforeSnap.data() : null

      await deleteDoc(ref)
      await logAudit({
        action: "DELETE",
        entity: "ranger",
        entityId: pendingDelete.id,
        before: (beforeData as Record<string, unknown> | null) ?? null,
        after: null,
        userEmail: user?.email,
      })
      toast({ title: "Ranger deleted successfully", variant: "success" })
      setPendingDelete(null)
      await fetchRangers()
    } catch {
      toast({ title: "Failed to delete ranger", variant: "error" })
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchRangers()
      toast({ title: "Rangers refreshed", variant: "success" })
    } catch {
      toast({ title: "Failed to refresh rangers", variant: "error" })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApprove = async () => {
    if (!pendingApproval) return
    setApprovingId(pendingApproval.id)
    try {
      const ref = doc(db, pendingApproval.sourceCollection, pendingApproval.id)
      const beforeSnap = await getDoc(ref)
      const beforeData = beforeSnap.exists() ? beforeSnap.data() : null

      const nextData = {
        verificationStatus: "verified",
        verified: true,
        role: pendingApproval.selectedRole,
        "profile.role": pendingApproval.selectedRole,
      }

      await updateDoc(ref, nextData)
      await logAudit({
        action: "UPDATE",
        entity: "ranger",
        entityId: pendingApproval.id,
        before: (beforeData as Record<string, unknown> | null) ?? null,
        after: nextData,
        userEmail: user?.email,
      })

      toast({ title: "User verified successfully", variant: "success" })
      setPendingApproval(null)
      await fetchRangers()
    } catch {
      toast({ title: "Failed to verify user", variant: "error" })
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 border-b pb-4 mt-2">
        <div className="bg-primary/20 p-2.5 rounded-xl">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Rangers</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage ranger accounts. Admin emails are excluded.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => void handleRefresh()} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Add Ranger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select
          className="h-8 rounded-lg border bg-background px-2.5 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            No ranger accounts found.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ranger) => (
                <TableRow key={ranger.id}>
                  <TableCell className="font-mono text-xs">{ranger.workerId || "N/A"}</TableCell>
                  <TableCell>{ranger.name}</TableCell>
                  <TableCell>{ranger.email}</TableCell>
                  <TableCell className="capitalize">{ranger.role || "ranger"}</TableCell>
                  <TableCell>
                    <Badge className={ranger.verificationStatus === "verified" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}>
                      {ranger.verificationStatus === "verified" ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={ranger.status === "active" ? "bg-green-600 text-white" : "bg-muted text-foreground"}>
                      {ranger.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        openEdit({
                          id: ranger.id,
                          sourceCollection: ranger.sourceCollection,
                          name: ranger.name,
                          email: ranger.email,
                          workerId: ranger.workerId,
                          role: ranger.role,
                          verificationStatus: ranger.verificationStatus,
                          status: ranger.status,
                        })
                      }
                    >
                      Edit
                    </Button>
                    {ranger.verificationStatus === "pending" ? (
                      <Button
                        variant="secondary"
                        disabled={approvingId === ranger.id}
                        onClick={() =>
                          setPendingApproval({
                            id: ranger.id,
                            name: ranger.name,
                            sourceCollection: ranger.sourceCollection,
                            selectedRole: ranger.role === "admin" ? "admin" : "forester",
                          })
                        }
                      >
                        {approvingId === ranger.id ? "Approving..." : "Approve"}
                      </Button>
                    ) : null}
                    <Button
                      variant="destructive"
                      onClick={() => setPendingDelete({ id: ranger.id, name: ranger.name, sourceCollection: ranger.sourceCollection })}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formState.id ? "Edit Ranger" : "Create Ranger"}</DialogTitle>
            <DialogDescription>Save ranger information and status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ranger-name">Name</Label>
              <Input
                id="ranger-name"
                value={formState.name}
                maxLength={120}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ranger-email">Email</Label>
              <Input
                id="ranger-email"
                type="email"
                value={formState.email}
                maxLength={254}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ranger-worker-id">Worker ID</Label>
              <Input
                id="ranger-worker-id"
                value={formState.workerId}
                maxLength={50}
                onChange={(event) => setFormState((prev) => ({ ...prev, workerId: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ranger-status">Status</Label>
              <select
                id="ranger-status"
                className="h-8 w-full rounded-lg border bg-background px-2.5 text-sm"
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, status: event.target.value as RangerStatus }))
                }
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ranger-verification">Verification</Label>
              <select
                id="ranger-verification"
                className="h-8 w-full rounded-lg border bg-background px-2.5 text-sm"
                value={formState.verificationStatus}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, verificationStatus: event.target.value as RangerFormState["verificationStatus"] }))
                }
              >
                <option value="pending">pending</option>
                <option value="verified">verified</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ranger-role">Role</Label>
              <Input
                id="ranger-role"
                value={formState.role}
                maxLength={30}
                onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))}
                placeholder="ranger"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSave()}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingApproval)} onOpenChange={(open) => !open && setPendingApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify New User</DialogTitle>
            <DialogDescription>
              Approve {pendingApproval?.name || "this user"} and assign role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approval-role">Assigned Role</Label>
            <select
              id="approval-role"
              className="h-8 w-full rounded-lg border bg-background px-2.5 text-sm"
              value={pendingApproval?.selectedRole ?? "forester"}
              onChange={(event) =>
                setPendingApproval((prev) => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    selectedRole: event.target.value as PendingApprovalState["selectedRole"],
                  }
                })
              }
            >
              <option value="forester">forester</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingApproval(null)}>
              Cancel
            </Button>
            <Button disabled={approvingId === pendingApproval?.id} onClick={() => void handleApprove()}>
              {approvingId === pendingApproval?.id ? "Approving..." : "Verify User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ranger</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {pendingDelete?.name || "this ranger"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletingId === pendingDelete?.id}
              onClick={() => void handleDelete()}
            >
              {deletingId === pendingDelete?.id ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
