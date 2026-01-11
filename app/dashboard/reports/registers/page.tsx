import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

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

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Cashier</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Opening Time</th>
              <th className="text-left p-4">Opening Amount</th>
              <th className="text-left p-4">Closing Time</th>
              <th className="text-left p-4">Closing Amount</th>
              <th className="text-left p-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((session) => (
              <tr key={session.id} className="border-b hover:bg-accent">
                <td className="p-4 font-medium">
                  {session.users?.full_name || 'Unknown'}
                </td>
                <td className="p-4">
                  <Badge variant={session.status === 'open' ? 'default' : 'secondary'}>
                    {session.status}
                  </Badge>
                </td>
                <td className="p-4 text-sm">
                  {new Date(session.opening_time).toLocaleString()}
                </td>
                <td className="p-4 font-medium">
                  {formatCurrency(Number(session.opening_amount), currency)}
                </td>
                <td className="p-4 text-sm">
                  {session.closing_time ? new Date(session.closing_time).toLocaleString() : '-'}
                </td>
                <td className="p-4 font-medium">
                  {session.closing_amount 
                    ? formatCurrency(Number(session.closing_amount), currency) 
                    : '-'}
                </td>
                <td className="p-4 text-sm text-muted-foreground truncate max-w-50">
                  {session.notes || '-'}
                </td>
              </tr>
            ))}
            {(!sessions || sessions.length === 0) && (
               <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    No register sessions found.
                  </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
