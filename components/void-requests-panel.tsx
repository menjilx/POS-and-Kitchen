"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, X, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { approveVoidRequest, denyVoidRequest } from "@/lib/void-utils"
import { formatCurrency } from "@/lib/utils"

type VoidRequestRow = {
  id: string
  sale_id: string
  reason: string
  status: string
  created_at: string
  requested_by: string
  requester: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null
  sales: { order_number: string; total_amount: number } | { order_number: string; total_amount: number }[] | null
}

interface VoidRequestsPanelProps {
  currency?: string
}

export function VoidRequestsPanel({ currency = "$" }: VoidRequestsPanelProps) {
  const { toast } = useToast()
  const [requests, setRequests] = useState<VoidRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [denyNotesMap, setDenyNotesMap] = useState<Record<string, string>>({})
  const [showDenyInput, setShowDenyInput] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("void_requests")
      .select(`
        id, sale_id, reason, status, created_at, requested_by,
        requester:users!void_requests_requested_by_fkey (full_name, email),
        sales (order_number, total_amount)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching void requests:", error)
      return
    }

    setRequests((data ?? []) as unknown as VoidRequestRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRequests()

    const channel = supabase
      .channel("void-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "void_requests" },
        () => { fetchRequests() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchRequests])

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      await approveVoidRequest(supabase, requestId, user.id)
      toast({ title: "Approved", description: "Void request approved. Order has been voided." })
      await fetchRequests()
    } catch (err) {
      console.error("Error approving void request:", err)
      toast({ title: "Error", description: "Failed to approve void request", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeny = async (requestId: string) => {
    const notes = denyNotesMap[requestId]?.trim()
    if (!notes) {
      toast({ title: "Required", description: "Please provide a reason for denying", variant: "destructive" })
      return
    }

    setProcessingId(requestId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      await denyVoidRequest(supabase, requestId, user.id, notes)
      toast({ title: "Denied", description: "Void request has been denied." })
      setShowDenyInput(null)
      setDenyNotesMap((prev) => { const next = { ...prev }; delete next[requestId]; return next })
      await fetchRequests()
    } catch (err) {
      console.error("Error denying void request:", err)
      toast({ title: "Error", description: "Failed to deny void request", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const resolveUser = (row: VoidRequestRow) => {
    const user = Array.isArray(row.requester) ? row.requester[0] : row.requester
    return user?.full_name || user?.email || "Unknown"
  }

  const resolveSale = (row: VoidRequestRow) => {
    return Array.isArray(row.sales) ? row.sales[0] : row.sales
  }

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    return `${hours}h ${mins % 60}m ago`
  }

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Void Requests</CardTitle>
          <Badge variant="destructive" className="text-xs">{requests.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={requests.length > 3 ? "h-64" : ""}>
          <div className="divide-y">
            {requests.map((req) => {
              const sale = resolveSale(req)
              const isProcessing = processingId === req.id
              return (
                <div key={req.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{sale?.order_number ?? "—"}</span>
                      {sale && (
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(sale.total_amount, currency)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeElapsed(req.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{req.reason}</p>
                  <p className="text-xs text-muted-foreground">Requested by {resolveUser(req)}</p>

                  {showDenyInput === req.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Reason for denying..."
                        value={denyNotesMap[req.id] || ""}
                        onChange={(e) => setDenyNotesMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeny(req.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Deny"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setShowDenyInput(null) }}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => handleApprove(req.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setShowDenyInput(req.id)}
                        disabled={isProcessing}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
