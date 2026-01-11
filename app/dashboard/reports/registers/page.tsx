import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RegistersTable } from './registers-table'
import type { RegisterSessionWithUser } from './columns'

export default async function RegistersReportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/login')

  const { data: sessions } = await supabase
    .from('cashier_sessions')
    .select('*, users(full_name)')
    .eq('tenant_id', userData.tenant_id)
    .order('opening_time', { ascending: false })
    .limit(50)

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userData.tenant_id)
    .single()

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Register Sessions</h1>
      </div>

      <RegistersTable data={sessions as unknown as RegisterSessionWithUser[]} currency={currency} />
    </div>
  )
}
