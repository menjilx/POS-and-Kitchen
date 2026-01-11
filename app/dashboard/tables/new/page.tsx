'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { TableStatus } from '@/types/database'

type TableFormData = {
  table_number: string
  capacity: string
  location: string
  status: TableStatus
}

const tableStatuses = ['available', 'occupied', 'reserved', 'cleaning'] as const

export default function NewTablePage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<TableFormData>({
    table_number: '',
    capacity: '',
    location: '',
    status: 'available',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      const { error } = await supabase.from('tables').insert({
        tenant_id: userData.tenant_id,
        table_number: formData.table_number,
        capacity: parseInt(formData.capacity),
        location: formData.location,
        status: formData.status,
      })

      if (error) throw error

      router.push('/dashboard/tables')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tables" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Add Table</h1>
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
              <label htmlFor="table_number" className="block text-sm font-medium mb-2">
                Table Number *
              </label>
              <input
                id="table_number"
                type="text"
                required
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 1, A1, VIP-1"
              />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium mb-2">
                Capacity *
              </label>
              <input
                id="capacity"
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Number of guests"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Main Dining, Patio, VIP Section"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Initial Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => {
                const next = e.target.value
                if ((tableStatuses as readonly string[]).includes(next)) {
                  setFormData({ ...formData, status: next as TableStatus })
                }
              }}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Table'}
          </button>
        </form>
      </div>
    </div>
  )
}
