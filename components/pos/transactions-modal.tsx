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
import { Clock, User, Search, RefreshCcw, Ban, Loader2, Download, Printer } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAppSettings } from "@/hooks/use-app-settings"
import { normalizeReceiptSettings, type ReceiptData } from "@/components/receipt/printable-receipt"
import { useBluetoothPrinter } from "@/hooks/use-bluetooth-printer"
import { printToNetwork } from "@/lib/print-client"
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
  discountAmount?: number
  taxAmount?: number
  paymentRef?: string
  cardLastFour?: string
  paymentNotes?: string
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
  discount_amount: number | null
  tax_amount: number | null
  payment_data: Record<string, unknown> | null
  payment_notes: string | null
}

interface TransactionsModalProps {
  isOpen: boolean
  onClose: () => void
  onRefund: (sale: Transaction) => Promise<void>
  onVoid: (sale: Transaction) => Promise<void>
  session: CashierSession | null
  canVoid?: boolean
  canManageOrders?: boolean
  currency?: string
}

type SaleItemDetail = {
  quantity: number
  unit_price: number
  menu_items: { name: string } | null
}

type SaleDetailForReceipt = {
  id: string
  order_number: string
  sale_time: string
  total_amount: number
  tax_amount: number
  discount_amount: number
  discount_name: string | null
  payment_status: string
  payment_method: string | null
  payment_notes: string | null
  payment_data: Record<string, unknown> | null
  notes: string | null
  sale_items: SaleItemDetail[]
  customers: { name: string } | null
  cashier: { full_name: string | null; email: string } | null
}

export function TransactionsModal({
  isOpen,
  onClose,
  onRefund,
  onVoid,
  session,
  canVoid = false,
  canManageOrders = false,
  currency = "$"
}: TransactionsModalProps) {
  const { toast } = useToast()
  const { settings: tenantSettings } = useAppSettings()
  const printerMethod = tenantSettings.printer?.method ?? 'browser'
  const btPaperWidth = tenantSettings.printer?.bluetooth?.paperWidth ?? 80
  const bluetoothPrinter = useBluetoothPrinter(btPaperWidth)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [reprintingId, setReprintingId] = useState<string | null>(null)

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
          discount_amount,
          tax_amount,
          payment_data,
          payment_notes,
          tables (table_number),
          sale_items (quantity)
        `)
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
        const pd = s.payment_data as Record<string, unknown> | null

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
          tableNumber: table?.table_number ?? undefined,
          discountAmount: s.discount_amount ?? undefined,
          taxAmount: s.tax_amount ?? undefined,
          paymentRef: (pd?.ref as string) || undefined,
          cardLastFour: (pd?.cardLastFour as string) || undefined,
          paymentNotes: s.payment_notes ?? undefined,
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
    if (action === 'refund' && !canManageOrders) return
    if (action === 'void' && !canVoid && !canManageOrders) return

    if (action === 'refund') {
      if (!confirm(`Are you sure you want to refund this order? This action cannot be undone.`)) return
    }

    setProcessingId(transaction.id)
    try {
      if (action === 'refund') {
        await onRefund(transaction)
      } else {
        await onVoid(transaction)
      }
      await fetchTransactions()
    } catch (error) {
      console.error(error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReprint = async (transaction: Transaction) => {
    setReprintingId(transaction.id)
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, order_number, sale_time, total_amount, tax_amount,
          discount_amount, discount_name, payment_status, payment_method,
          payment_notes, payment_data, notes,
          sale_items (quantity, unit_price, menu_items (name)),
          customers (name),
          cashier:users!sales_created_by_fkey (full_name, email)
        `)
        .eq('id', transaction.id)
        .single()

      if (error || !data) {
        toast({ title: "Error", description: "Failed to load order details for printing", variant: "destructive" })
        return
      }

      const sale = data as unknown as SaleDetailForReceipt
      const pd = sale.payment_data
      const subtotal = sale.total_amount - (sale.tax_amount ?? 0) + (sale.discount_amount ?? 0)
      const cashierName = sale.cashier?.full_name || sale.cashier?.email || undefined

      let customerName = sale.customers?.name || "Walk-in Customer"
      if (!sale.customers && sale.notes?.startsWith("Customer: ")) {
        customerName = sale.notes.replace("Customer: ", "").split(" | Note: ")[0]
      }

      const receiptData: ReceiptData = {
        items: (sale.sale_items ?? []).map((item) => ({
          name: item.menu_items?.name || "Unknown Item",
          quantity: item.quantity,
          price: item.unit_price,
        })),
        subtotal,
        tax: sale.tax_amount ?? 0,
        discount: sale.discount_amount ?? 0,
        discountName: sale.discount_name ?? undefined,
        total: sale.total_amount,
        cashierName,
        customerName,
        orderNumber: sale.order_number,
        date: new Date(sale.sale_time).toLocaleString(),
        paymentMethod: sale.payment_method ?? undefined,
        paymentStatus: sale.payment_status,
        paymentRef: (pd?.ref as string) || undefined,
        paymentNotes: sale.payment_notes ?? (pd?.notes as string) ?? undefined,
        receivedAmount: typeof pd?.receivedAmount === 'number' ? pd.receivedAmount : undefined,
        changeAmount: typeof pd?.changeAmount === 'number' ? pd.changeAmount : undefined,
        currency,
      }

      const rs = normalizeReceiptSettings(tenantSettings.receipt)

      if (printerMethod === 'bluetooth' && bluetoothPrinter.state === 'connected') {
        try {
          await bluetoothPrinter.printReceipt(receiptData, rs)
          toast({ title: "Printed", description: `Receipt for ${transaction.orderNumber} sent to printer` })
          return
        } catch { /* fallback */ }
      }

      if (printerMethod === 'network') {
        const result = await printToNetwork(receiptData, rs)
        if (result.success) {
          toast({ title: "Printed", description: `Receipt for ${transaction.orderNumber} sent to printer` })
          return
        }
      }

      // Fallback: open sales detail page for browser print
      window.open(`/dashboard/sales/${transaction.id}`, '_blank')
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Failed to print receipt", variant: "destructive" })
    } finally {
      setReprintingId(null)
    }
  }

  const handleDownloadReport = () => {
    if (transactions.length === 0) return

    const escCsv = (val: string) => `"${val.replace(/"/g, '""')}"`
    const headers = ["Order #", "Date", "Time", "Customer", "Table", "Items", "Total", "Discount", "Tax", "Payment Method", "Payment Ref", "Card Last Four", "Payment Notes", "Status"]
    const csvContent = [
        headers.join(","),
        ...transactions.map(t => [
            t.orderNumber,
            t.date,
            t.time,
            escCsv(t.customerName),
            t.tableNumber || "",
            t.itemsCount,
            t.totalAmount,
            t.discountAmount || 0,
            t.taxAmount || 0,
            t.paymentMethod || "",
            t.paymentRef || "",
            t.cardLastFour || "",
            escCsv(t.paymentNotes || ""),
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
                            t.paymentStatus === 'voided' ? 'destructive' :
                            'secondary'
                        }
                        className={`text-[10px] h-5 px-1.5 capitalize ${
                          t.paymentStatus === 'voided' ? 'bg-red-100 text-red-800 border-red-200' : ''
                        }`}
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
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleReprint(t)}
                            disabled={!!reprintingId}
                        >
                            {reprintingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3 mr-1" />}
                            Reprint
                        </Button>
                        {(canManageOrders || canVoid) && t.paymentStatus !== 'voided' && t.paymentStatus !== 'refunded' && (
                          <>
                            {canManageOrders && t.paymentStatus === 'paid' && (
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
                            {(canVoid || canManageOrders) && ['pending', 'partial', 'paid'].includes(t.paymentStatus) && (
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
                          </>
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
