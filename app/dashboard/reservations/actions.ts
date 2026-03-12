'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ReservationStatus } from '@/types/database'

const reservationStatuses = [
  'pending',
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show',
] as const

export async function updateReservation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
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
  const statusRaw = String(formData.get('status') ?? '')
  const status: ReservationStatus = (reservationStatuses as readonly string[]).includes(statusRaw)
    ? (statusRaw as ReservationStatus)
    : 'pending'
  const specialRequests = formData.get('specialRequests') as string
  const notes = formData.get('notes') as string

  const redirectTo = formData.get('redirectTo') as string | null

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
      status,
      special_requests: specialRequests || null,
      notes: notes || null,
    })
    .eq('id', reservationId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/reservations')

  if (redirectTo === null || redirectTo === undefined) {
    redirect('/dashboard/reservations')
  } else if (redirectTo !== '') {
    redirect(redirectTo)
  }
  // If redirectTo is empty string, skip redirect (modal usage)
}
