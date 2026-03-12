'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { addDays, addMinutes, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, parseISO, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { updateReservation } from '../actions'

type CalendarView = 'day' | 'week' | 'month'

type TableRow = {
  id: string
  table_number: string
  capacity: number
}

type ReservationRow = {
  id: string
  customer_name: string
  customer_phone?: string | null
  customer_email?: string | null
  reservation_time: string
  duration_minutes: number
  status: string
  party_size: number
  table_id?: string | null
  special_requests?: string | null
  notes?: string | null
  tables?: { table_number: string; capacity: number } | null
}

function clampView(value: string | null): CalendarView {
  if (value === 'day' || value === 'week' || value === 'month') return value
  return 'week'
}

function toDateKey(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function getSlotLabel(base: Date, slotIndex: number) {
  return format(addMinutes(startOfDay(base), slotIndex * 30), 'ha')
}

function formatRangeLabel(view: CalendarView, date: Date) {
  if (view === 'day') return format(date, 'PPPP')
  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = addDays(start, 6)
    const left = format(start, 'MMM d')
    const right = format(end, 'MMM d, yyyy')
    return `${left} – ${right}`
  }
  return format(date, 'MMMM yyyy')
}

function getReservationRangeLabel(r: ReservationRow) {
  const start = new Date(r.reservation_time)
  const duration = Math.max(0, Number(r.duration_minutes) || 0)
  const end = addMinutes(start, duration)
  const startLabel = format(start, 'HH:mm')
  const endLabel = format(end, 'HH:mm')
  return `${startLabel}–${endLabel}`
}

function getReservationSlotIndex(r: ReservationRow) {
  const d = new Date(r.reservation_time)
  const minutes = d.getHours() * 60 + d.getMinutes()
  return Math.max(0, Math.min(47, Math.floor(minutes / 30)))
}

export function ReservationCalendarClient({
  initialView,
  initialDate,
  reservations,
  tables,
}: {
  initialView: CalendarView
  initialDate: string
  reservations: ReservationRow[]
  tables: TableRow[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localView, setLocalView] = useState<CalendarView>(initialView)
  const [selectedReservation, setSelectedReservation] = useState<ReservationRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeDate = useMemo(() => {
    const raw = searchParams.get('date') ?? initialDate
    return parseISO(raw)
  }, [initialDate, searchParams])

  const activeView = useMemo(() => {
    const raw = searchParams.get('view')
    return raw ? clampView(raw) : localView
  }, [localView, searchParams])

  const setQuery = (next: { view?: CalendarView; date?: Date }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.view) params.set('view', next.view)
    if (next.date) params.set('date', next.date.toISOString())
    router.push(`/dashboard/reservations/calendar?${params.toString()}`)
  }

  const onChangeView = (next: CalendarView) => {
    setLocalView(next)
    setQuery({ view: next })
  }

  const goToday = () => setQuery({ date: new Date() })

  const goPrev = () => {
    if (activeView === 'day') return setQuery({ date: addDays(activeDate, -1) })
    if (activeView === 'week') return setQuery({ date: addWeeks(activeDate, -1) })
    return setQuery({ date: addMonths(activeDate, -1) })
  }

  const goNext = () => {
    if (activeView === 'day') return setQuery({ date: addDays(activeDate, 1) })
    if (activeView === 'week') return setQuery({ date: addWeeks(activeDate, 1) })
    return setQuery({ date: addMonths(activeDate, 1) })
  }

  const monthGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(activeDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(activeDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [activeDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(activeDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: addDays(start, 6) })
  }, [activeDate])

  const reservationByDay = useMemo(() => {
    const map = new Map<string, ReservationRow[]>()
    for (const r of reservations) {
      const key = toDateKey(new Date(r.reservation_time))
      const list = map.get(key) ?? []
      list.push(r)
      map.set(key, list)
    }
    return map
  }, [reservations])

  const reservationByDaySlot = useMemo(() => {
    const map = new Map<string, Map<number, ReservationRow[]>>()
    for (const r of reservations) {
      const d = new Date(r.reservation_time)
      const dayKey = toDateKey(d)
      const slot = getReservationSlotIndex(r)
      const dayMap = map.get(dayKey) ?? new Map<number, ReservationRow[]>()
      const list = dayMap.get(slot) ?? []
      list.push(r)
      dayMap.set(slot, list)
      map.set(dayKey, dayMap)
    }
    return map
  }, [reservations])

  const today = new Date()
  const label = formatRangeLabel(activeView, activeDate)
  const slots = Array.from({ length: 48 }, (_, i) => i)

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goPrev}>
            Prev
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goNext}>
            Next
          </Button>
          <div className="ml-2 text-sm font-medium text-muted-foreground">{label}</div>
        </div>

        <ToggleGroup
          type="single"
          value={activeView}
          onValueChange={(v) => (v ? onChangeView(clampView(v)) : null)}
          variant="outline"
        >
          <ToggleGroupItem value="day" className="h-8 px-2.5">
            Day
          </ToggleGroupItem>
          <ToggleGroupItem value="week" className="h-8 px-2.5">
            Week
          </ToggleGroupItem>
          <ToggleGroupItem value="month" className="h-8 px-2.5">
            Month
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="mt-4">
        {activeView === 'month' && (
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="bg-muted px-2 py-2 text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {monthGrid.map((day) => {
              const key = toDateKey(day)
              const dayReservations = reservationByDay.get(key) ?? []
              const inMonth = day.getMonth() === activeDate.getMonth()
              const isToday = isSameDay(day, today)
              const show = dayReservations.slice(0, 3)
              const remaining = Math.max(0, dayReservations.length - show.length)
              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-28 bg-background p-2',
                    !inMonth && 'bg-muted/30 text-muted-foreground',
                    isToday && 'ring-1 ring-inset ring-primary'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className={cn('text-xs font-medium', inMonth ? 'text-foreground' : 'text-muted-foreground')}
                      onClick={() => setQuery({ view: 'day', date: day })}
                    >
                      {format(day, 'd')}
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {show.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReservation(r)}
                        className="block w-full text-left truncate rounded-sm bg-primary/10 px-2 py-1 text-xs hover:bg-primary/15"
                      >
                        {getReservationRangeLabel(r)}
                        {r.tables?.table_number ? ` · T${r.tables.table_number}` : ''}
                        {' '}
                        {r.customer_name}
                      </button>
                    ))}
                    {remaining > 0 && (
                      <div className="text-xs text-muted-foreground">+{remaining} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeView === 'week' && (
          <div className="overflow-x-auto">
            <div className="min-w-225">
              <div className="grid grid-cols-[88px_repeat(7,1fr)] gap-px overflow-hidden rounded-md border bg-border">
                <div className="bg-muted px-2 py-2 text-xs font-medium text-muted-foreground">Time</div>
                {weekDays.map((d) => {
                  const isToday = isSameDay(d, today)
                  return (
                    <button
                      key={toDateKey(d)}
                      type="button"
                      className={cn(
                        'bg-muted px-2 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/70',
                        isToday && 'text-primary'
                      )}
                      onClick={() => setQuery({ view: 'day', date: d })}
                    >
                      <div className="font-medium">{format(d, 'EEE')}</div>
                      <div>{format(d, 'MMM d')}</div>
                    </button>
                  )
                })}

                {slots.map((slot) => (
                  <div key={slot} className="contents">
                    <div className="bg-background px-2 py-2 text-xs text-muted-foreground">
                      {slot % 2 === 0 ? getSlotLabel(activeDate, slot) : ''}
                    </div>
                    {weekDays.map((day) => {
                      const dayKey = toDateKey(day)
                      const list = reservationByDaySlot.get(dayKey)?.get(slot) ?? []
                      return (
                        <div key={`${dayKey}-${slot}`} className="bg-background px-2 py-2 align-top">
                          <div className="space-y-1">
                            {list.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setSelectedReservation(r)}
                                className="block w-full text-left truncate rounded-sm bg-primary/10 px-2 py-1 text-xs hover:bg-primary/15"
                              >
                                {getReservationRangeLabel(r)}
                                {r.tables?.table_number ? ` · T${r.tables.table_number}` : ''}
                                {' '}
                                {r.customer_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'day' && (
          <div className="grid grid-cols-[88px_1fr] gap-px overflow-hidden rounded-md border bg-border">
            <div className="bg-muted px-2 py-2 text-xs font-medium text-muted-foreground">Time</div>
            <div className="bg-muted px-2 py-2 text-xs font-medium text-muted-foreground">
              {format(activeDate, 'EEE, MMM d')}
            </div>
            {slots.map((slot) => {
              const dayKey = toDateKey(activeDate)
              const list = reservationByDaySlot.get(dayKey)?.get(slot) ?? []
              return (
                <div key={slot} className="contents">
                  <div className="bg-background px-2 py-2 text-xs text-muted-foreground">
                    {slot % 2 === 0 ? getSlotLabel(activeDate, slot) : ''}
                  </div>
                  <div className="bg-background px-2 py-2">
                    <div className="space-y-1">
                      {list.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedReservation(r)}
                          className="block w-full text-left truncate rounded-sm bg-primary/10 px-2 py-1 text-xs hover:bg-primary/15"
                        >
                          {getReservationRangeLabel(r)}
                          {r.tables?.table_number ? ` · T${r.tables.table_number}` : ''}
                          {' '}
                          {r.customer_name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedReservation} onOpenChange={(open) => { if (!open) setSelectedReservation(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reservation</DialogTitle>
            <DialogDescription>Update reservation details below.</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <form
              action={async (formData) => {
                startTransition(async () => {
                  try {
                    await updateReservation(formData)
                  } catch {
                    // redirect throws in server actions — refresh on success
                  }
                  setSelectedReservation(null)
                  router.refresh()
                })
              }}
              className="space-y-6"
            >
              <input type="hidden" name="reservationId" value={selectedReservation.id} />
              <input type="hidden" name="redirectTo" value="" />

              <div>
                <label htmlFor="modal-customerName" className="block text-sm font-medium mb-2">
                  Customer Name *
                </label>
                <input
                  id="modal-customerName"
                  type="text"
                  name="customerName"
                  required
                  defaultValue={selectedReservation.customer_name ?? ''}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-customerPhone" className="block text-sm font-medium mb-2">
                    Phone
                  </label>
                  <input
                    id="modal-customerPhone"
                    type="tel"
                    name="customerPhone"
                    defaultValue={selectedReservation.customer_phone ?? ''}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="modal-customerEmail" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    id="modal-customerEmail"
                    type="email"
                    name="customerEmail"
                    defaultValue={selectedReservation.customer_email ?? ''}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="modal-partySize" className="block text-sm font-medium mb-2">
                    Party Size *
                  </label>
                  <input
                    id="modal-partySize"
                    type="number"
                    name="partySize"
                    min="1"
                    required
                    defaultValue={selectedReservation.party_size ?? 1}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="modal-reservationTime" className="block text-sm font-medium mb-2">
                    Date & Time *
                  </label>
                  <input
                    id="modal-reservationTime"
                    type="datetime-local"
                    name="reservationTime"
                    required
                    defaultValue={
                      selectedReservation.reservation_time
                        ? new Date(selectedReservation.reservation_time).toISOString().slice(0, 16)
                        : ''
                    }
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="modal-durationMinutes" className="block text-sm font-medium mb-2">
                    Duration (min)
                  </label>
                  <input
                    id="modal-durationMinutes"
                    type="number"
                    name="durationMinutes"
                    min="15"
                    defaultValue={selectedReservation.duration_minutes ?? 90}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-tableId" className="block text-sm font-medium mb-2">
                  Table
                </label>
                <select
                  id="modal-tableId"
                  name="tableId"
                  defaultValue={selectedReservation.table_id || ''}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select table (optional)</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.table_number} (Capacity: {table.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  id="modal-status"
                  name="status"
                  defaultValue={selectedReservation.status ?? 'pending'}
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
                <label htmlFor="modal-specialRequests" className="block text-sm font-medium mb-2">
                  Special Requests
                </label>
                <textarea
                  id="modal-specialRequests"
                  name="specialRequests"
                  defaultValue={selectedReservation.special_requests ?? ''}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="e.g., Birthday celebration, dietary restrictions..."
                />
              </div>

              <div>
                <label htmlFor="modal-notes" className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="modal-notes"
                  name="notes"
                  defaultValue={selectedReservation.notes ?? ''}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Internal notes..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Updating...' : 'Update Reservation'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
