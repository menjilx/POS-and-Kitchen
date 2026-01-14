import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { addDays, addWeeks, endOfMonth, endOfWeek, isValid, parseISO, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import type { Reservation, Table } from '@/types/database'
import { ReservationCalendarClient } from './reservation-calendar-client'

type ReservationRow = Reservation & {
  tables?: Pick<Table, 'table_number' | 'capacity'> | null
}

type CalendarView = 'day' | 'week' | 'month'

function parseCalendarView(value: unknown): CalendarView {
  if (value === 'day' || value === 'week' || value === 'month') return value
  return 'week'
}

function parseCalendarDate(value: unknown): Date {
  if (typeof value !== 'string' || !value.trim()) return new Date()
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : new Date()
}

function getFetchRange(view: CalendarView, date: Date) {
  if (view === 'day') {
    const start = startOfDay(date)
    return { start, end: addDays(start, 1) }
  }

  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    return { start, end: addWeeks(start, 1) }
  }

  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const start = startOfWeek(monthStart, { weekStartsOn: 1 })
  const end = addDays(endOfWeek(monthEnd, { weekStartsOn: 1 }), 1)
  return { start, end }
}

export default async function ReservationCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>
}) {
  const params = await searchParams
  const view = parseCalendarView(params.view)
  const date = parseCalendarDate(params.date)

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

  const { start, end } = getFetchRange(view, date)

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      *,
      tables (table_number, capacity)
    `)
    .eq('tenant_id', userData.tenant_id)
    .gte('reservation_time', start.toISOString())
    .lt('reservation_time', end.toISOString())
    .order('reservation_time', { ascending: true })

  const reservationRows = (reservations ?? []) as ReservationRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-primary hover:underline">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Reservation Calendar</h1>
        </div>
        <Link
          href="/dashboard/reservations/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Reservation
        </Link>
      </div>

      <ReservationCalendarClient initialView={view} initialDate={date.toISOString()} reservations={reservationRows} />
    </div>
  )
}
