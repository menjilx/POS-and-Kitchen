import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'
import { columns } from './columns'

export default async function ReservationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      *,
      tables (table_number, capacity)
    `)
    .eq('tenant_id', userData.tenant_id)
    .gte('reservation_time', today)
    .order('reservation_time', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reservations</h1>
        <Link
          href="/dashboard/reservations/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Reservation
        </Link>
      </div>

      <DataTable columns={columns} data={reservations || []} />
    </div>
  )
}
