import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type AuditAction = "CREATE" | "UPDATE" | "DELETE"
export type AuditEntity = "tree" | "area" | "ranger"

interface LogAuditArgs {
  action: AuditAction
  entity: AuditEntity
  entityId: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  userEmail?: string | null
}

export async function logAudit({
  action,
  entity,
  entityId,
  before,
  after,
  userEmail,
}: LogAuditArgs) {
  if (!userEmail) return
  await addDoc(collection(db, "audit_logs"), {
    action,
    entity,
    entityId,
    performedBy: userEmail,
    timestamp: serverTimestamp(),
    changes: {
      before: before ?? null,
      after: after ?? null,
    },
  })
}
