'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

// Define types locally since they might not be fully exported or easy to import with relations
type SaleItemWithDetails = {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  menu_items: {
    name: string
  } | null
}

type SaleDetail = {
  id: string
  order_number: string
  sale_time: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'cancelled'
  payment_method: string | null
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
  kds_orders: {
    status: string
    assigned_station: string | null
    started_at: string | null
    completed_at: string | null
  }[]
  tables: {
      table_number: string
  } | null
}

export default function SaleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    const fetchSale = async () => {
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) return

      // Fetch Tenant Settings
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', userData.tenant_id)
        .single()
      
      const settings = tenantData?.settings as { currency?: string }
      if (settings?.currency) setCurrency(settings.currency)

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
          kds_orders (status, assigned_station, started_at, completed_at)
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

  if (loading) {
    return <div className="p-8 flex justify-center">Loading...</div>
  }

  if (!sale) {
    return <div className="p-8 flex justify-center">Sale not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sales
        </Button>
        <h1 className="text-3xl font-bold">Order {sale.order_number}</h1>
        <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'} className="ml-2 capitalize">
            {sale.payment_status}
        </Badge>
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
                                    <Badge variant="outline" className={`capitalize ${
                                        kds.status === 'served' ? 'bg-green-100 text-green-800 border-green-200' :
                                        kds.status === 'ready' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                        kds.status === 'preparing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {kds.status}
                                    </Badge>
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
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium capitalize">{sale.payment_method?.replace('_', ' ') || '-'}</p>
                    </div>
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
  )
}
