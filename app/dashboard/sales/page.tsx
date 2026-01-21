import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SalesTable } from './sales-table'
import type { Sale } from './columns'

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

  const [
    { data: salesData },
    { data: tenantData }
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('*, kds_orders(status, started_at, completed_at), sale_items(quantity)')
      .eq('tenant_id', userData.tenant_id)
      .order('sale_time', { ascending: false })
      .limit(1000),
    supabase
      .from('tenants')
      .select('settings')
      .eq('id', userData.tenant_id)
      .single()
  ])

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'
  
  // Cast salesData to match the Sale type required by columns
  // We know the shape matches because of the select query
  const sales = (salesData || []) as unknown as Sale[]

  const canDelete = userData.role === 'owner' || userData.role === 'manager'

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

      <SalesTable data={sales} currency={currency} canDelete={canDelete} />
    </div>
  )
}
