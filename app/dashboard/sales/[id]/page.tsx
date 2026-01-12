'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { PrintableReceipt, type ReceiptSettings } from '@/components/receipt/printable-receipt'

type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'
type KdsOrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
type PaymentMethod = 'cash' | 'card' | 'ewallet' | 'bank_transfer' | null

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
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false)
  const [updatingPaymentMethod, setUpdatingPaymentMethod] = useState(false)
  const [updatingKdsOrderId, setUpdatingKdsOrderId] = useState<string | null>(null)
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null)
  const [cashierName, setCashierName] = useState<string>('')
  const [printingReceipt, setPrintingReceipt] = useState(false)

  useEffect(() => {
    const fetchSale = async () => {
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setCashierName(user.user_metadata?.full_name || user.email || '')

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) return
      setTenantId(userData.tenant_id)

      // Fetch Tenant Settings
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', userData.tenant_id)
        .single()
      
      const settings = tenantData?.settings as { currency?: string; receipt?: ReceiptSettings }
      if (settings?.currency) setCurrency(settings.currency)
      if (settings?.receipt) setReceiptSettings(settings.receipt)

      // Fetch Sale
      const { data: saleData, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            menu_items (name)
          ),
          customers (name, email, phone),
          tables (table_number),
          kds_orders (id, status, assigned_station, started_at, completed_at)
        `)
        .eq('id', id)
        .eq('tenant_id', userData.tenant_id)
        .single()

      if (error) {
        console.error('Error fetching sale:', error)
      } else {
        setSale(saleData as unknown as SaleDetail)
      }
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
    if (!value || typeof value !== 'object') return null
    return value as PaymentData
  })()

  const updatePaymentStatus = async (nextStatus: PaymentStatus) => {
    if (!sale) return
    if (!tenantId) return
    if (nextStatus === sale.payment_status) return

    const previousStatus = sale.payment_status
    setSale({ ...sale, payment_status: nextStatus })
    setUpdatingPaymentStatus(true)

    const { error } = await supabase
      .from('sales')
      .update({ payment_status: nextStatus })
      .eq('id', sale.id)
      .eq('tenant_id', tenantId)

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
    if (!tenantId) return

    const nextMethod: PaymentMethod = nextValue === '__none__' ? null : (nextValue as PaymentMethod)
    if (nextMethod === sale.payment_method) return

    const previousMethod = sale.payment_method
    setSale({ ...sale, payment_method: nextMethod })
    setUpdatingPaymentMethod(true)

    const { error } = await supabase
      .from('sales')
      .update({ payment_method: nextMethod })
      .eq('id', sale.id)
      .eq('tenant_id', tenantId)

    setUpdatingPaymentMethod(false)

    if (error) {
      setSale((current) => (current ? { ...current, payment_method: previousMethod } : current))
      toast({ title: 'Error', description: 'Failed to update payment method', variant: 'destructive' })
      return
    }

    toast({ title: 'Updated', description: 'Payment method updated' })
  }

  const updateKdsStatus = async (orderId: string, nextStatus: KdsOrderStatus) => {
    if (!sale) return
    if (!tenantId) return

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
      .eq('tenant_id', tenantId)

    setUpdatingKdsOrderId(null)

    if (error) {
      setSale((current) => {
        if (!current) return current
        return {
          ...current,
          kds_orders: current.kds_orders.map((o) => (o.id === orderId ? currentOrder : o)),
        }
      })
      toast({ title: 'Error', description: 'Failed to update kitchen status', variant: 'destructive' })
      return
    }

    toast({ title: 'Updated', description: 'Kitchen status updated' })
  }

  if (loading) {
    return <div className="p-8 flex justify-center">Loading...</div>
  }

  if (!sale) {
    return <div className="p-8 flex justify-center">Sale not found</div>
  }

  const subtotal = sale.total_amount - sale.tax_amount + sale.discount_amount

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {receiptSettings && (
        <div className="hidden print:block fixed inset-0 z-50 bg-white p-0 m-0 w-full h-full overflow-hidden">
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
              cashierName: cashierName || undefined,
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
          <Button variant="outline" className="ml-auto" onClick={() => setPrintingReceipt(true)} disabled={!receiptSettings}>
            Print Receipt
          </Button>
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
                    <CardTitle>Kitchen Status</CardTitle>
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
                                        <span className="font-medium">{kds.assigned_station || 'Kitchen'}</span>
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
                                        <SelectTrigger className="h-8 w-[140px]">
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
                            <SelectTrigger className="h-8 w-[160px]">
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
                            {sale.payment_method?.replace('_', ' ') || '-'}
                          </Badge>
                          <Select
                            value={sale.payment_method ?? '__none__'}
                            onValueChange={(value) => updatePaymentMethod(value)}
                            disabled={updatingPaymentMethod}
                          >
                            <SelectTrigger className="h-8 w-[160px]">
                              <SelectValue placeholder="Set method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">-</SelectItem>
                              <SelectItem value="cash">cash</SelectItem>
                              <SelectItem value="card">card</SelectItem>
                              <SelectItem value="ewallet">ewallet</SelectItem>
                              <SelectItem value="bank_transfer">bank transfer</SelectItem>
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
