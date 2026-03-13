import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RegistersTable } from './registers-table'
import type { RegisterSessionWithUser } from './columns'

export default async function RegistersReportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: sessions },
    { data: currencySetting },
    { data: userData },
  ] = await Promise.all([
    supabase
      .from('cashier_sessions')
      .select('*, users(full_name)')
      .order('opening_time', { ascending: false })
      .limit(50),
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'currency')
      .single(),
    supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single(),
  ])

  const currency = currencySetting?.value ?? 'USD'
  const canForceClose = userData?.role === 'owner' || userData?.role === 'manager'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Register Sessions</h1>
      </div>

      <RegistersTable
        data={sessions as unknown as RegisterSessionWithUser[]}
        currency={currency}
        canForceClose={canForceClose}
      />
    </div>
  )
}
