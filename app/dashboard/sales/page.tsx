import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { Eye } from 'lucide-react'
import Link from 'next/link'

export default async function SalesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/login')

  const { data: sales } = await supabase
    .from('sales')
    .select('*, kds_orders(status, started_at, completed_at)')
    .eq('tenant_id', userData.tenant_id)
    .order('sale_time', { ascending: false })
    .limit(50)

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userData.tenant_id)
    .single()

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  // Helper to get KDS status
  interface SaleKdsOrder {
    status: string
  }

  interface Sale {
    kds_orders: SaleKdsOrder | SaleKdsOrder[] | null
  }

  const getKdsStatus = (sale: Sale) => {
    if (!sale.kds_orders || (Array.isArray(sale.kds_orders) && sale.kds_orders.length === 0)) return 'unknown'
    
    const orders = Array.isArray(sale.kds_orders) ? sale.kds_orders : [sale.kds_orders]
    const statuses = orders.map((o) => o.status)

    // Priority: preparing > pending > ready > served > cancelled
    // If any item is in progress, the whole order is in progress
    if (statuses.some((s: string) => s === 'preparing')) return 'preparing'
    if (statuses.some((s: string) => s === 'pending')) return 'pending'
    if (statuses.some((s: string) => s === 'ready')) return 'ready'
    
    // If all are finished (served or cancelled)
    const allServedOrCancelled = statuses.every((s: string) => s === 'served' || s === 'cancelled')
    const anyServed = statuses.some((s: string) => s === 'served')
    
    if (allServedOrCancelled && anyServed) return 'served'
    if (statuses.every((s: string) => s === 'cancelled')) return 'cancelled'
    
    return statuses[0]
  }

  const getPrepTime = (sale: Sale) => {
    if (!sale.kds_orders || (Array.isArray(sale.kds_orders) && sale.kds_orders.length === 0)) return '-'
    
    const orders = Array.isArray(sale.kds_orders) ? sale.kds_orders : [sale.kds_orders]
    
    // Find earliest start and latest completion
    let start: number | null = null
    let end: number | null = null
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders.forEach((o: any) => {
        if (o.started_at) {
            const s = new Date(o.started_at).getTime()
            if (start === null || s < start) start = s
        }
        if (o.completed_at) {
            const e = new Date(o.completed_at).getTime()
            if (end === null || e > end) end = e
        }
    })

    if (!start) return '-'
    if (!end) return 'In Progress'

    const diffMs = end - start
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)

    return `${diffMins}m ${diffSecs}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'served': return 'bg-green-100 text-green-800'
      case 'ready': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales</h1>
        <a
          href="/dashboard/pos"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Sale
        </a>
      </div>

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Order #</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Amount</th>
              <th className="text-left p-4">Payment</th>
              <th className="text-left p-4">Kitchen Status</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales?.map((sale) => {
              const kdsStatus = getKdsStatus(sale)
              return (
                <tr key={sale.id} className="border-b hover:bg-accent">
                  <td className="p-4 font-medium">{sale.order_number}</td>
                  <td className="p-4 capitalize">{sale.sale_type?.replace('_', ' ')}</td>
                  <td className="p-4 font-medium">{formatCurrency(Number(sale.total_amount), currency)}</td>
                  <td className="p-4 capitalize">{sale.payment_method?.replace('_', ' ') || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sale.payment_status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.payment_status}
                    </span>
                  </td>
                  <td className="p-4">
                     {kdsStatus !== 'unknown' && (
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(kdsStatus)}`}>
                          {kdsStatus}
                        </span>
                     )}
                     {kdsStatus === 'unknown' && <span className="text-gray-400 text-xs">-</span>}
                  </td>
                  <td className="p-4 text-sm font-mono">
                      {getPrepTime(sale)}
                  </td>
                  <td className="p-4 text-sm">
                    {new Date(sale.sale_time).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <Link href={`/dashboard/sales/${sale.id}`} className="p-2 hover:bg-muted rounded-full inline-flex">
                        <Eye className="w-4 h-4 text-gray-500" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
