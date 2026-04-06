import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ToastVariant = "success" | "error" | "info"

interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastItem extends ToastInput {
  id: string
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantClasses: Record<ToastVariant, string> = {
  success: "border-green-600/40 bg-green-600/10",
  error: "border-destructive/40 bg-destructive/10",
  info: "border-border bg-card",
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random()}`
      setItems((current) => [...current, { ...input, id }])
      window.setTimeout(() => dismiss(id), 3500)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100000] flex w-full max-w-sm flex-col gap-2 px-4">
        {items.map((item) => {
          const variant = item.variant ?? "info"
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3 shadow-lg backdrop-blur ${variantClasses[variant]}`}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0"
                  onClick={() => dismiss(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
