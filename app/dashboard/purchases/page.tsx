import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PurchasesTable } from './purchases-table'
import type { Purchase } from './columns'

export default async function PurchasesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
    .order('invoice_date', { ascending: false })
    .limit(50)

  const { data: currencySetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'currency')
    .single()

  const currency = currencySetting?.value ?? 'USD'

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
