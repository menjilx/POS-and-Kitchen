import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PurchasesTable } from './purchases-table'
import type { Purchase } from './columns'

export default async function PurchasesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/login')

  const { data: purchasesData } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers (name),
      purchase_items (
        *,
        ingredients (name, unit)
      )
    `)
    .eq('tenant_id', userData.tenant_id)
    .order('invoice_date', { ascending: false })
    .limit(50)

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userData.tenant_id)
    .single()

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  const purchases = (purchasesData || []) as unknown as Purchase[]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchases</h1>
        <Link
          href="/dashboard/purchases/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Purchase
        </Link>
      </div>

      <PurchasesTable data={purchases} currency={currency} />
    </div>
  )
}
