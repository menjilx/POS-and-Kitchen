import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SalesTable } from './sales-table'
import type { Sale } from './columns'

type PaymentMethodOption = {
  id: string
  label: string
}

const defaultPaymentMethods: PaymentMethodOption[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Credit/Debit Card' },
  { id: 'house_account', label: 'House Account (In-house)' },
  { id: 'ewallet', label: 'E-Wallet' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
]

export default async function SalesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/login')

  const [
    { data: salesData },
    { data: currencySetting },
    { data: pmSetting }
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('*, kds_orders(status, started_at, completed_at), sale_items(quantity), tables(table_number)')
      .order('sale_time', { ascending: false })
      .limit(1000),
    supabase.from('app_settings').select('value').eq('key', 'currency').single(),
    supabase.from('app_settings').select('value').eq('key', 'payment_methods').single()
  ])

  const currency = currencySetting?.value ?? 'USD'
  let paymentMethods: PaymentMethodOption[] = defaultPaymentMethods
  try {
    const parsed = pmSetting?.value ? JSON.parse(pmSetting.value) : []
    if (Array.isArray(parsed) && parsed.length > 0) paymentMethods = parsed
  } catch {}
  
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

      <SalesTable data={sales} currency={currency} canDelete={canDelete} paymentMethods={paymentMethods} />
    </div>
  )
}
