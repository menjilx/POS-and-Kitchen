"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/utils"
import { Clock, User, Search, RefreshCcw, Ban, Loader2, Download } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { CashierSession } from "@/types/database"

export interface Transaction {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  paymentStatus: string
  paymentMethod: string | null
  date: string
  time: string
  itemsCount: number
  tableNumber?: string
}

type SaleItemRow = {
  quantity: number | null
}

type SaleTableRow = {
  table_number: string | null
}

type SaleRow = {
  id: string
  order_number: string
  total_amount: number
  payment_status: string
  payment_method: string | null
  sale_date: string
  sale_time: string
  notes: string | null
  sale_items: SaleItemRow[] | null
  tables: SaleTableRow[] | SaleTableRow | null
}

interface TransactionsModalProps {
  isOpen: boolean
  onClose: () => void
  onRefund: (sale: Transaction) => Promise<void>
  onVoid: (sale: Transaction) => Promise<void>
  session: CashierSession | null
  currency?: string
}

export function TransactionsModal({
  isOpen,
  onClose,
  onRefund,
  onVoid,
  session,
  currency = "$"
}: TransactionsModalProps) {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!session) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select(`
          id,
          order_number,
          total_amount,
          payment_status,
          payment_method,
          sale_date,
          sale_time,
          customer_id,
          notes,
          created_at,
          tables (table_number),
          sale_items (quantity)
        `)
        .eq('tenant_id', session.tenant_id)
        .eq('created_by', session.user_id)
        .gte('created_at', session.opening_time)
        .order('created_at', { ascending: false })

      if (session.closing_time) {
        query = query.lte('created_at', session.closing_time)
      }

      const { data, error } = await query

      if (error) throw error

      const rows = (Array.isArray(data) ? data : []) as unknown as SaleRow[]

      const formatted: Transaction[] = rows.map((s) => {
        let name = "Guest"
        if (s.notes?.startsWith("Customer: ")) {
            name = s.notes.replace("Customer: ", "")
            if (name.includes(" | Note: ")) {
                name = name.split(" | Note: ")[0]
            }
        }

        const table = Array.isArray(s.tables) ? s.tables[0] : s.tables

        return {
          id: s.id,
          orderNumber: s.order_number,
          customerName: name,
          totalAmount: s.total_amount,
          paymentStatus: s.payment_status,
          paymentMethod: s.payment_method,
          date: new Date(s.sale_date).toLocaleDateString(),
          time: new Date(s.sale_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          itemsCount: (s.sale_items ?? []).reduce((acc, item) => acc + (item.quantity ?? 0), 0),
          tableNumber: table?.table_number ?? undefined
        }
      })

      setTransactions(formatted)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to load transactions", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [session, toast])

  useEffect(() => {
    if (isOpen && session) {
      void fetchTransactions()
    }
  }, [fetchTransactions, isOpen, session])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setTimeout(() => setSearchQuery(""), 300)
    }
  }

  const handleAction = async (action: 'refund' | 'void', transaction: Transaction) => {
    if (!confirm(`Are you sure you want to ${action} this order? This action cannot be undone.`)) return

    setProcessingId(transaction.id)
    try {
      if (action === 'refund') {
        await onRefund(transaction)
      } else {
        await onVoid(transaction)
      }
      // Refresh list
      await fetchTransactions()
    } catch (error) {
      console.error(error)
      // Toast is handled in parent
    } finally {
      setProcessingId(null)
    }
  }

  const handleDownloadReport = () => {
    if (transactions.length === 0) return

    const headers = ["Order #", "Date", "Time", "Customer", "Table", "Items", "Total", "Payment Method", "Status"]
    const csvContent = [
        headers.join(","),
        ...transactions.map(t => [
            t.orderNumber,
            t.date,
            t.time,
            `"${t.customerName.replace(/"/g, '""')}"`, // Escape quotes
            t.tableNumber || "",
            t.itemsCount,
            t.totalAmount,
            t.paymentMethod || "",
            t.paymentStatus
        ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `session_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredTransactions = transactions.filter((t) => {
    const query = searchQuery.toLowerCase()
    return (
      t.orderNumber.toLowerCase().includes(query) ||
      t.customerName.toLowerCase().includes(query)
    )
  })

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-200">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
                <DialogTitle>Session Transactions</DialogTitle>
                <DialogDescription className="mt-1">
                    All transactions in current session ({session?.opening_time ? new Date(session.opening_time).toLocaleString() : ''})
                </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={transactions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
            </Button>
          </div>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-100 pr-4">
          <div className="space-y-4">
            {isLoading ? (
               <div className="flex justify-center py-8">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No matching transactions found." : "No transactions in this session."}
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{t.orderNumber}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {t.time}
                      </span>
                      <Badge 
                        variant={
                            t.paymentStatus === 'paid' ? 'default' : 
                            t.paymentStatus === 'refunded' ? 'destructive' : 
                            'secondary'
                        } 
                        className="text-[10px] h-5 px-1.5 capitalize"
                      >
                          {t.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{t.customerName}</span>
                      {t.tableNumber && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            T-{t.tableNumber}
                          </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.itemsCount} items • {t.date} • {t.paymentMethod?.replace('_', ' ') || 'No Payment'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-lg">
                      {formatCurrency(t.totalAmount, currency)}
                    </span>
                    <div className="flex gap-2">
                        {t.paymentStatus === 'paid' && (
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 text-xs border-red-200 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleAction('refund', t)}
                                disabled={!!processingId}
                            >
                                {processingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3 mr-1" />}
                                Return
                            </Button>
                        )}
                        {t.paymentStatus === 'pending' && (
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 text-xs border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                                onClick={() => handleAction('void', t)}
                                disabled={!!processingId}
                            >
                                {processingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
                                Void
                            </Button>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
