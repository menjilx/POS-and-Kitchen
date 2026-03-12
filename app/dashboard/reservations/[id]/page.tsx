import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Reservation, Table } from '@/types/database'
import { updateReservation } from '../actions'

export default async function EditReservationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const [reservation, tables] = await Promise.all([
    supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('tables')
      .select('*')
      .order('table_number'),
  ])

  if (!reservation?.data) {
    notFound()
  }

  const reservationRow = reservation.data as Reservation
  const tableRows = (tables?.data ?? []) as Table[]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reservations" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Reservation</h1>
      </div>

      <form action={updateReservation} className="bg-card rounded-lg border p-6 space-y-6">
        <input type="hidden" name="reservationId" value={reservation?.data?.id} />

        <div>
          <label htmlFor="customerName" className="block text-sm font-medium mb-2">
            Customer Name *
          </label>
          <input
            id="customerName"
            type="text"
            name="customerName"
            required
            defaultValue={reservationRow.customer_name ?? ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium mb-2">
              Phone
            </label>
            <input
              id="customerPhone"
              type="tel"
              name="customerPhone"
              defaultValue={reservationRow.customer_phone ?? ''}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="customerEmail"
              type="email"
              name="customerEmail"
              defaultValue={reservationRow.customer_email ?? ''}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="partySize" className="block text-sm font-medium mb-2">
              Party Size *
            </label>
            <input
              id="partySize"
              type="number"
              name="partySize"
              min="1"
              required
              defaultValue={reservationRow.party_size ?? 1}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="reservationTime" className="block text-sm font-medium mb-2">
              Date & Time *
            </label>
            <input
              id="reservationTime"
              type="datetime-local"
              name="reservationTime"
              required
              defaultValue={
                reservationRow.reservation_time
                  ? new Date(reservationRow.reservation_time).toISOString().slice(0, 16)
                  : ''
              }
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="durationMinutes" className="block text-sm font-medium mb-2">
              Duration (min)
            </label>
            <input
              id="durationMinutes"
              type="number"
              name="durationMinutes"
              min="15"
              defaultValue={reservationRow.duration_minutes ?? 90}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="tableId" className="block text-sm font-medium mb-2">
            Table
          </label>
          <select
            id="tableId"
            name="tableId"
            defaultValue={reservationRow.table_id || ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select table (optional)</option>
            {tableRows.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.table_number} (Capacity: {table.capacity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={reservationRow.status ?? 'pending'}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>

        <div>
          <label htmlFor="specialRequests" className="block text-sm font-medium mb-2">
            Special Requests
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            defaultValue={reservationRow.special_requests ?? ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="e.g., Birthday celebration, dietary restrictions..."
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={reservationRow.notes ?? ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Internal notes..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Update Reservation
        </button>
      </form>
    </div>
  )
}
