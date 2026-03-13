"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DataTable } from "@/components/data-table"
import { getColumns, RegisterSessionWithUser } from "./columns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface RegistersTableProps {
  data: RegisterSessionWithUser[]
  currency: string
  canForceClose?: boolean
}

export function RegistersTable({ data, currency, canForceClose }: RegistersTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [forceClosingId, setForceClosingId] = useState<string | null>(null)
  const [confirmSession, setConfirmSession] = useState<RegisterSessionWithUser | null>(null)
  const [forceCloseNotes, setForceCloseNotes] = useState("")

  const handleForceClose = async () => {
    if (!confirmSession) return
    setForceClosingId(confirmSession.id)
    setConfirmSession(null)

    const { data: result, error } = await supabase
      .rpc('force_close_cashier_session', {
        p_session_id: confirmSession.id,
        p_notes: forceCloseNotes || null,
      })

    setForceClosingId(null)
    setForceCloseNotes("")

    if (error) {
      toast({ title: "Force Close Failed", description: error.message, variant: "destructive" })
      return
    }

    if (result && typeof result === 'object' && 'success' in result && !result.success) {
      toast({ title: "Force Close Failed", description: (result as { message?: string }).message || "Unknown error", variant: "destructive" })
      return
    }

    toast({ title: "Session Closed", description: "The register session has been force-closed." })
    router.refresh()
  }

  const columns = useMemo(() => getColumns(currency, {
    canForceClose,
    onForceClose: (session) => setConfirmSession(session),
    forceClosingId,
  }), [currency, canForceClose, forceClosingId])

  return (
    <>
      <DataTable columns={columns} data={data} />

      <Dialog open={!!confirmSession} onOpenChange={(open) => { if (!open) { setConfirmSession(null); setForceCloseNotes("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Close Register Session</DialogTitle>
            <DialogDescription>
              This will force-close the register session for <strong>{confirmSession?.users?.full_name || 'Unknown'}</strong> (opened {confirmSession ? new Date(confirmSession.opening_time).toLocaleString() : ''}). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="force-close-notes">Reason (optional)</Label>
            <Textarea
              id="force-close-notes"
              placeholder="e.g. Stale session from previous shift"
              value={forceCloseNotes}
              onChange={(e) => setForceCloseNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmSession(null); setForceCloseNotes("") }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleForceClose}>
              Force Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
