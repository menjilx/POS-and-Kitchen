import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function updateReservation(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    throw new Error('Unauthorized')
  }

  const reservationId = formData.get('reservationId') as string
  const tableId = formData.get('tableId') as string
  const customerName = formData.get('customerName') as string
  const customerPhone = formData.get('customerPhone') as string
  const customerEmail = formData.get('customerEmail') as string
  const partySize = parseInt(formData.get('partySize') as string)
  const reservationTime = formData.get('reservationTime') as string
  const durationMinutes = parseInt(formData.get('durationMinutes') as string)
  const status = formData.get('status') as string
  const specialRequests = formData.get('specialRequests') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase
    .from('reservations')
    .update({
      table_id: tableId || null,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      party_size: partySize,
      reservation_time: new Date(reservationTime).toISOString(),
      duration_minutes: durationMinutes,
      status: status as any,
      special_requests: specialRequests || null,
      notes: notes || null,
    })
    .eq('id', reservationId)
    .eq('tenant_id', userData.tenant_id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/reservations')
  redirect('/dashboard/reservations')
}

export default async function EditReservationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const [reservation, tables] = await Promise.all([
    supabase
      .from('reservations')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single(),
    supabase
      .from('tables')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('table_number'),
  ])

  if (!reservation?.data) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/reservations" className="text-primary hover:underline">
          ← Back
        </a>
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
            defaultValue={reservation?.data?.customer_name}
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
              defaultValue={reservation?.data?.customer_phone}
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
              defaultValue={reservation?.data?.customer_email}
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
              defaultValue={reservation?.data?.party_size}
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
              defaultValue={new Date(reservation?.data?.reservation_time || '').toISOString().slice(0, 16)}
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
              defaultValue={reservation?.data?.duration_minutes}
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
            defaultValue={reservation?.data?.table_id || ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select table (optional)</option>
            {tables?.data?.map((table: any) => (
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
            defaultValue={reservation?.data?.status}
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
            defaultValue={reservation?.data?.special_requests}
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
            defaultValue={reservation?.data?.notes}
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
