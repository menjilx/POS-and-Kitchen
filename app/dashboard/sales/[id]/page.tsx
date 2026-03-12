'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { SaleItemWithDetails } from './columns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { normalizeReceiptSettings, PrintableReceipt, type ReceiptSettings } from '@/components/receipt/printable-receipt'

type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'
type KdsOrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
type PaymentMethod = string | null

type PaymentMethodOption = {
  id: string
  label: string
}

type PaymentData = {
  ref?: string
  notes?: string
  attachment?: string | null
  receivedAmount?: number
  changeAmount?: number
}

type KdsOrder = {
  id: string
  status: KdsOrderStatus
  assigned_station: string | null
  started_at: string | null
  completed_at: string | null
}

type SaleHistoryEntry = {
  id: string
  action: string
  details: unknown
  created_at: string
  created_by: string | null
  created_by_user: {
    id: string
    email: string
    full_name: string | null
  } | { 
    id: string
    email: string
    full_name: string | null
  }[] | null
}

type SaleDetail = {
  id: string
  order_number: string
  sale_time: string
  total_amount: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  payment_notes: string | null
  payment_data: unknown
  sale_type: string
  notes: string | null
  tax_amount: number
  discount_amount: number
  discount_name: string | null
  sale_items: SaleItemWithDetails[]
  cashier: {
    id: string
    email: string
    full_name: string | null
  } | null
  customers: {
    name: string
    email: string | null
    phone: string | null
  } | null
  kds_orders: KdsOrder[]
  tables: {
      table_number: string
  } | null
}

export default function SaleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('USD')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false)
  const [updatingPaymentMethod, setUpdatingPaymentMethod] = useState(false)
  const [updatingKdsOrderId, setUpdatingKdsOrderId] = useState<string | null>(null)
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null)
  const [printingReceipt, setPrintingReceipt] = useState(false)
  const [stations, setStations] = useState<{ id: string; name: string }[]>([])
  const [saleHistory, setSaleHistory] = useState<SaleHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [deletingSale, setDeletingSale] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Credit/Debit Card' },
    { id: 'house_account', label: 'House Account (In-house)' },
    { id: 'ewallet', label: 'E-Wallet' },
    { id: 'bank_transfer', label: 'Bank Transfer' },
  ])

  useEffect(() => {
    const fetchSale = async () => {
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData) return
      setUserRole(userData.role)

      // Fetch App Settings
      const [
        { data: currencySetting },
        { data: receiptSetting },
        { data: pmSetting }
      ] = await Promise.all([
        supabase.from('app_settings').select('value').eq('key', 'currency').single(),
        supabase.from('app_settings').select('value').eq('key', 'receipt_settings').single(),
        supabase.from('app_settings').select('value').eq('key', 'payment_methods').single()
      ])

      if (currencySetting?.value) setCurrency(currencySetting.value)
      try {
        const parsedReceipt = receiptSetting?.value ? JSON.parse(receiptSetting.value) : null
        setReceiptSettings(normalizeReceiptSettings(parsedReceipt))
      } catch {
        setReceiptSettings(normalizeReceiptSettings(undefined))
      }
      try {
        const parsedPm = pmSetting?.value ? JSON.parse(pmSetting.value) : []
        if (Array.isArray(parsedPm) && parsedPm.length > 0) {
          setPaymentMethods(parsedPm)
        }
      } catch {}

      // Fetch Stations
      const { data: stationsData } = await supabase
        .from('kitchen_displays')
        .select('id, name')

      if (stationsData) {
        setStations(stationsData)
      }

      // Fetch Sale
      const { data: saleData, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            menu_items (name)
          ),
          cashier:users!sales_created_by_fkey (id, email, full_name),
          customers (name, email, phone),
          tables (table_number),
          kds_orders (id, status, assigned_station, started_at, completed_at)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching sale:', error)
      } else {
        setSale(saleData as unknown as SaleDetail)
      }

      const { data: historyData, error: historyError } = await supabase
        .from('sale_history')
        .select('id, action, details, created_at, created_by, created_by_user:users!sale_history_created_by_fkey (id, email, full_name)')
        .eq('sale_id', id)
        .order('created_at', { ascending: false })

      if (historyError) {
        console.error('Error fetching sale history:', historyError)
      } else {
        setSaleHistory((historyData ?? []) as SaleHistoryEntry[])
      }
      setHistoryLoading(false)
      setLoading(false)
    }

    fetchSale()
  }, [id, router])

  useEffect(() => {
    if (!printingReceipt) return
    const handleAfterPrint = () => setPrintingReceipt(false)
    window.addEventListener('afterprint', handleAfterPrint)
    window.setTimeout(() => window.print(), 0)
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [printingReceipt])

  const parsedPaymentData = (() => {
    if (!sale) return null
    const value = sale.payment_data
    if (!value) return null
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as PaymentData
      } catch {
        return null
      }
    }
    if (typeof value !== 'object') return null
    return value as PaymentData
  })()

  const resolvePaymentMethodLabel = (method: PaymentMethod | null) => {
    if (!method) return '-'
    const fallback = method.replace(/_/g, ' ')
    return paymentMethods.find((item) => item.id === method)?.label || fallback
  }

  const updatePaymentStatus = async (nextStatus: PaymentStatus) => {
    if (!sale) return
    if (nextStatus === sale.payment_status) return

    const previousStatus = sale.payment_status
    setSale({ ...sale, payment_status: nextStatus })
    setUpdatingPaymentStatus(true)

    const { error } = await supabase
      .from('sales')
      .update({ payment_status: nextStatus })
      .eq('id', sale.id)

    setUpdatingPaymentStatus(false)

    if (error) {
      setSale((current) => (current ? { ...current, payment_status: previousStatus } : current))
      toast({ title: 'Error', description: 'Failed to update payment status', variant: 'destructive' })
      return
    }

    toast({ title: 'Updated', description: 'Payment status updated' })
  }

  const updatePaymentMethod = async (nextValue: string) => {
    if (!sale) return

    const nextMethod: PaymentMethod = nextValue === '__none__' ? null : nextValue
    if (nextMethod === sale.payment_method) return

    const previousMethod = sale.payment_method
    setSale({ ...sale, payment_method: nextMethod })
    setUpdatingPaymentMethod(true)

    const { error } = await supabase
      .from('sales')
      .update({ payment_method: nextMethod })
      .eq('id', sale.id)

    setUpdatingPaymentMethod(false)

    if (error) {
      setSale((current) => (current ? { ...current, payment_method: previousMethod } : current))
      toast({ title: 'Error', description: 'Failed to update payment method', variant: 'destructive' })
      return
    }

    toast({ title: 'Updated', description: 'Payment method updated' })
  }

  const availablePaymentMethods = (() => {
    if (!sale?.payment_method) return paymentMethods
    const exists = paymentMethods.some((method) => method.id === sale.payment_method)
    if (exists) return paymentMethods
    return [
      ...paymentMethods,
      {
        id: sale.payment_method,
        label: resolvePaymentMethodLabel(sale.payment_method),
      },
    ]
  })()

  const updateKdsStatus = async (orderId: string, nextStatus: KdsOrderStatus) => {
    if (!sale) return

    const currentOrder = sale.kds_orders?.find((o) => o.id === orderId)
    if (!currentOrder) return
    if (currentOrder.status === nextStatus) return

    const now = new Date().toISOString()
    const updateData: Partial<Pick<KdsOrder, 'status' | 'started_at' | 'completed_at'>> = { status: nextStatus }
    if (nextStatus === 'preparing' && !currentOrder.started_at) {
      updateData.started_at = now
    }
    if ((nextStatus === 'ready' || nextStatus === 'served' || nextStatus === 'cancelled') && !currentOrder.completed_at) {
      updateData.completed_at = now
    }

    setSale({
      ...sale,
      kds_orders: sale.kds_orders.map((o) => (o.id === orderId ? { ...o, ...updateData } as KdsOrder : o)),
    })
    setUpdatingKdsOrderId(orderId)

    const { error } = await supabase
      .from('kds_orders')
      .update(updateData)
      .eq('id', orderId)

    setUpdatingKdsOrderId(null)

    if (error) {
      setSale((current) => {
        if (!current) return current
        return {
          ...current,
          kds_orders: current.kds_orders.map((o) => (o.id === orderId ? currentOrder : o)),
        }
      })
      toast({ title: 'Error', description: 'Failed to update display status', variant: 'destructive' })
      return
    }

    toast({ title: 'Updated', description: 'Display status updated' })
  }

  const canDelete = userRole === 'owner' || userRole === 'manager'

  const handleDeleteSale = async () => {
    if (!sale) return
    setDeletingSale(true)
    try {
      const { data: deletedRows, error } = await supabase
        .from('sales')
        .delete()
        .eq('id', sale.id)
        .select('id')

      if (error) throw error
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('No rows deleted. Check permissions or record availability.')
      }

      toast({ title: 'Sale deleted', description: `Order ${sale.order_number} was deleted.` })
      setDeleteDialogOpen(false)
      router.push('/dashboard/sales')
      router.refresh()
    } catch (err) {
      const errorDetails =
        err && typeof err === 'object'
          ? Object.fromEntries(Object.getOwnPropertyNames(err).map((key) => [key, (err as Record<string, unknown>)[key]]))
          : err
      console.error('Delete sale failed', errorDetails)
      const errorLike = err as { message?: string; details?: string; hint?: string; code?: string } | null
      const message =
        (errorLike?.message || errorLike?.details || errorLike?.hint || errorLike?.code) ?? 'Failed to delete sale'
      toast({ title: 'Error', description: message, variant: 'destructive' })
      setDeletingSale(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center">Loading...</div>
  }

  if (!sale) {
    return <div className="p-8 flex justify-center">Sale not found</div>
  }

  const cashierLabel = sale.cashier?.full_name || sale.cashier?.email || '-'

  const subtotal = sale.total_amount - sale.tax_amount + sale.discount_amount

  const resolveHistoryActor = (entry: SaleHistoryEntry) => {
    const user = Array.isArray(entry.created_by_user) ? entry.created_by_user[0] : entry.created_by_user
    if (user?.full_name) return user.full_name
    if (user?.email) return user.email
    if (entry.created_by) return entry.created_by
    return 'System'
  }

  const resolveHistoryAction = (action: string) => {
    if (action === 'created') return 'Order created'
    if (action === 'updated') return 'Order updated'
    if (action === 'deleted') return 'Order deleted'
    if (action === 'refunded') return 'Order refunded'
    return action.replace(/_/g, ' ')
  }

  const formatHistoryValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return '-'
    if (key === 'payment_method') return resolvePaymentMethodLabel(value as PaymentMethod)
    if (key === 'payment_status') return String(value)
    if (key === 'total_amount' || key === 'discount_amount' || key === 'tax_amount') {
      const numericValue = typeof value === 'number' ? value : Number(value)
      return Number.isNaN(numericValue) ? '-' : formatCurrency(numericValue, currency)
    }
    if (key === 'sale_type') return String(value).replace(/_/g, ' ')
    return String(value)
  }

  const resolveHistoryChanges = (entry: SaleHistoryEntry) => {
    const details = entry.details as { old?: Record<string, unknown>; new?: Record<string, unknown> } | null
    const oldRow = details?.old ?? null
    const newRow = details?.new ?? null
    const keysToTrack = ['payment_status', 'payment_method', 'total_amount', 'discount_amount', 'tax_amount', 'sale_type']

    if (entry.action === 'created' && newRow) {
      return `Total ${formatHistoryValue('total_amount', newRow.total_amount)}`
    }
    if (entry.action === 'deleted' && oldRow) {
      return `Total ${formatHistoryValue('total_amount', oldRow.total_amount)}`
    }
    if (entry.action === 'refunded') {
      return 'Payment status set to refunded'
    }
    if (!oldRow || !newRow) return null

    const changes = keysToTrack
      .filter((key) => oldRow[key] !== newRow[key])
      .map((key) => {
        const label = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
        return `${label}: ${formatHistoryValue(key, oldRow[key])} → ${formatHistoryValue(key, newRow[key])}`
      })

    return changes.length > 0 ? changes.join(', ') : null
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && deletingSale) return
          setDeleteDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Delete order {sale.order_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deletingSale}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSale} disabled={deletingSale}>
              {deletingSale ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {receiptSettings && (
        <div className="block fixed -left-625 top-0 z-9999 bg-white p-0 m-0 w-full h-full overflow-hidden print:left-0 print:inset-0">
          <PrintableReceipt
            settings={receiptSettings}
            data={{
              items: (sale.sale_items ?? []).map((item) => ({
                name: item.menu_items?.name || 'Unknown Item',
                quantity: item.quantity,
                price: item.unit_price,
              })),
              subtotal,
              tax: sale.tax_amount,
              discount: sale.discount_amount,
              discountName: sale.discount_name,
              total: sale.total_amount,
              cashierName: cashierLabel === '-' ? undefined : cashierLabel,
              customerName: sale.customers?.name || 'Walk-in Customer',
              orderNumber: sale.order_number,
              date: new Date(sale.sale_time).toLocaleString(),
              paymentMethod: sale.payment_method ?? undefined,
              paymentStatus: sale.payment_status,
              paymentRef: parsedPaymentData?.ref,
              paymentNotes: sale.payment_notes ?? parsedPaymentData?.notes,
              receivedAmount: parsedPaymentData?.receivedAmount,
              changeAmount: parsedPaymentData?.changeAmount,
              currency,
            }}
          />
        </div>
      )}
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sales
          </Button>
          <h1 className="text-3xl font-bold">Order {sale.order_number}</h1>
          <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'} className="ml-2 capitalize">
            {sale.payment_status}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            {canDelete ? (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={deletingSale}>
                Delete
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setPrintingReceipt(true)} disabled={!receiptSettings}>
            Print Receipt
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-sm text-muted-foreground">
                                <th className="text-left py-2">Item</th>
                                <th className="text-right py-2">Qty</th>
                                <th className="text-right py-2">Price</th>
                                <th className="text-right py-2">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.sale_items?.map((item) => (
                                <tr key={item.id} className="border-b last:border-0">
                                    <td className="py-3">
                                        <span className="font-medium">{item.menu_items?.name || 'Unknown Item'}</span>
                                    </td>
                                    <td className="text-right py-3">{item.quantity}</td>
                                    <td className="text-right py-3">{formatCurrency(item.unit_price, currency)}</td>
                                    <td className="text-right py-3">{formatCurrency(item.total_price, currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t">
                                <td colSpan={3} className="text-right py-3 font-medium">Subtotal</td>
                                <td className="text-right py-3">
                                    {formatCurrency(
                                        (sale.total_amount - sale.tax_amount + sale.discount_amount), 
                                        currency
                                    )}
                                </td>
                            </tr>
                            {sale.discount_amount > 0 && (
                                <tr>
                                    <td colSpan={3} className="text-right py-2 text-muted-foreground">
                                        Discount {sale.discount_name && `(${sale.discount_name})`}
                                    </td>
                                    <td className="text-right py-2 text-red-500">
                                        -{formatCurrency(sale.discount_amount, currency)}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={3} className="text-right py-2 text-muted-foreground">Tax</td>
                                <td className="text-right py-2">{formatCurrency(sale.tax_amount, currency)}</td>
                            </tr>
                            <tr className="border-t text-lg font-bold">
                                <td colSpan={3} className="text-right py-4">Total</td>
                                <td className="text-right py-4">{formatCurrency(sale.total_amount, currency)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Display Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {sale.kds_orders && sale.kds_orders.length > 0 ? (
                        <div className="space-y-2">
                            {sale.kds_orders.map((kds, idx) => {
                                let duration = null
                                if (kds.started_at) {
                                    if (kds.completed_at) {
                                        const start = new Date(kds.started_at).getTime()
                                        const end = new Date(kds.completed_at).getTime()
                                        const diff = Math.floor((end - start) / 1000)
                                        const mins = Math.floor(diff / 60)
                                        const secs = diff % 60
                                        duration = `${mins}m ${secs}s`
                                    } else {
                                        duration = 'In Progress'
                                    }
                                }

                                return (
                                <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                          {stations.find((s) => s.id === kds.assigned_station)?.name ||
                                            kds.assigned_station ||
                                            'No Display'}
                                        </span>
                                        {duration && <span className="text-xs text-muted-foreground">Prep: {duration}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={`capitalize ${
                                          kds.status === 'served' ? 'bg-green-100 text-green-800 border-green-200' :
                                          kds.status === 'ready' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                          kds.status === 'preparing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                          kds.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                                          'bg-gray-100 text-gray-800'
                                      }`}>
                                          {kds.status}
                                      </Badge>
                                      <Select
                                        value={kds.status}
                                        onValueChange={(value) => updateKdsStatus(kds.id, value as KdsOrderStatus)}
                                        disabled={updatingKdsOrderId === kds.id}
                                      >
                                        <SelectTrigger className="h-8 w-35">
                                          <SelectValue placeholder="Set status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">pending</SelectItem>
                                          <SelectItem value="preparing">preparing</SelectItem>
                                          <SelectItem value="ready">ready</SelectItem>
                                          <SelectItem value="served">served</SelectItem>
                                          <SelectItem value="cancelled">cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No kitchen orders found.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sale History</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <p className="text-muted-foreground">Loading history...</p>
                ) : saleHistory.length > 0 ? (
                  <div className="space-y-3">
                    {saleHistory.map((entry) => {
                      const changes = resolveHistoryChanges(entry)
                      return (
                        <div key={entry.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{resolveHistoryAction(entry.action)}</p>
                            {changes && <p className="text-xs text-muted-foreground">{changes}</p>}
                            <p className="text-xs text-muted-foreground">{resolveHistoryActor(entry)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No history entries yet.</p>
                )}
              </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{sale.customers?.name || 'Walk-in Customer'}</p>
                    </div>
                    {sale.customers?.email && (
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{sale.customers.email}</p>
                        </div>
                    )}
                    {sale.customers?.phone && (
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{sale.customers.phone}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <p className="text-sm text-muted-foreground">Cashier</p>
                        <p className="font-medium">{cashierLabel}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(sale.sale_time).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{sale.sale_type.replace('_', ' ')}</p>
                    </div>
                    {sale.tables && (
                        <div>
                            <p className="text-sm text-muted-foreground">Table</p>
                            <p className="font-medium">{sale.tables.table_number}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-muted-foreground">Payment Status</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {sale.payment_status}
                          </Badge>
                          <Select
                            value={sale.payment_status}
                            onValueChange={(value) => updatePaymentStatus(value as PaymentStatus)}
                            disabled={updatingPaymentStatus}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue placeholder="Set payment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">pending</SelectItem>
                              <SelectItem value="partial">partial</SelectItem>
                              <SelectItem value="paid">paid</SelectItem>
                              <SelectItem value="refunded">refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {resolvePaymentMethodLabel(sale.payment_method)}
                          </Badge>
                          <Select
                            value={sale.payment_method ?? '__none__'}
                            onValueChange={(value) => updatePaymentMethod(value)}
                            disabled={updatingPaymentMethod}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue placeholder="Set method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">-</SelectItem>
                              {availablePaymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.id}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                    {sale.discount_amount > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Discount</p>
                        <p className="font-medium">
                          {sale.discount_name ? `${sale.discount_name} ` : ''}-{formatCurrency(sale.discount_amount, currency)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="font-medium">{formatCurrency(subtotal, currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tax</p>
                      <p className="font-medium">{formatCurrency(sale.tax_amount, currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">{formatCurrency(sale.total_amount, currency)}</p>
                    </div>
                    {typeof parsedPaymentData?.receivedAmount === 'number' && (
                      <div>
                        <p className="text-sm text-muted-foreground">Received</p>
                        <p className="font-medium">{formatCurrency(parsedPaymentData.receivedAmount, currency)}</p>
                      </div>
                    )}
                    {typeof parsedPaymentData?.changeAmount === 'number' && parsedPaymentData.changeAmount > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Change</p>
                        <p className="font-medium">{formatCurrency(parsedPaymentData.changeAmount, currency)}</p>
                      </div>
                    )}
                    {parsedPaymentData?.ref && (
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Ref</p>
                        <p className="font-medium">{parsedPaymentData.ref}</p>
                      </div>
                    )}
                    {(sale.payment_notes || parsedPaymentData?.notes) && (
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Notes</p>
                        <p className="text-sm">{sale.payment_notes || parsedPaymentData?.notes}</p>
                      </div>
                    )}
                    {sale.notes && (
                        <div>
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="text-sm">{sale.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      </div>
    </div>
  )
}
