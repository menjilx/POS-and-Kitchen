'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { Table } from '@/types/database'

export default function NewReservationPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: '',
    table_id: '',
    reservation_time: '',
    duration_minutes: '90',
    special_requests: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tables, setTables] = useState<Table[]>([])

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('table_number')

      setTables(((data ?? []) as unknown) as Table[])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const { error } = await supabase.from('reservations').insert({
        tenant_id: userData.tenant_id,
        table_id: formData.table_id || null,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        party_size: parseInt(formData.party_size),
        reservation_time: new Date(formData.reservation_time).toISOString(),
        duration_minutes: parseInt(formData.duration_minutes),
        special_requests: formData.special_requests,
        notes: formData.notes,
        status: 'pending',
      })

      if (error) throw error

      router.push('/dashboard/reservations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableTables = () => {
    const partySize = parseInt(formData.party_size) || 0
    if (partySize === 0) return tables
    return tables.filter((table) => table.capacity >= partySize)
  }

  const availableTables = getAvailableTables()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reservations" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">New Reservation</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer_name" className="block text-sm font-medium mb-2">
                Customer Name *
              </label>
              <input
                id="customer_name"
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="customer_phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div>
            <label htmlFor="customer_email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="john@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="party_size" className="block text-sm font-medium mb-2">
                Party Size *
              </label>
              <input
                id="party_size"
                type="number"
                min="1"
                required
                value={formData.party_size}
                onChange={(e) => setFormData({ ...formData, party_size: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="4"
              />
            </div>

            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium mb-2">
                Duration (minutes)
              </label>
              <input
                id="duration_minutes"
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="90"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reservation_time" className="block text-sm font-medium mb-2">
                Date & Time *
              </label>
              <input
                id="reservation_time"
                type="datetime-local"
                required
                value={formData.reservation_time}
                onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="table_id" className="block text-sm font-medium mb-2">
                Table
              </label>
              <select
                id="table_id"
                value={formData.table_id}
                onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select table (optional)</option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.table_number} (Capacity: {table.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="special_requests" className="block text-sm font-medium mb-2">
              Special Requests
            </label>
            <textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="Window seat, high chair, etc."
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes (Internal)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="Any internal notes..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Reservation'}
          </button>
        </form>
      </div>
    </div>
  )
}
