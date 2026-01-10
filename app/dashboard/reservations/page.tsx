import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
        <a
          href="/dashboard/reservations/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Reservation
        </a>
      </div>

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Party Size</th>
              <th className="text-left p-4">Table</th>
              <th className="text-left p-4">Time</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations?.map((reservation) => (
              <tr key={reservation.id} className="border-b hover:bg-accent">
                <td className="p-4">
                  <div>
                    <p className="font-medium">{reservation.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{reservation.customer_phone}</p>
                  </div>
                </td>
                <td className="p-4">{reservation.party_size}</td>
                <td className="p-4">
                  {reservation.tables ? `Table ${reservation.tables.table_number}` : '-'}
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium">
                      {new Date(reservation.reservation_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{reservation.duration_minutes} min</p>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      reservation.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : reservation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : reservation.status === 'seated'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {reservation.status}
                  </span>
                </td>
                <td className="p-4">
                  <a
                    href={`/dashboard/reservations/${reservation.id}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
