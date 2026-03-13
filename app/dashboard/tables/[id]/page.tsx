'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { TableStatus } from '@/types/database'
import { Trash2 } from 'lucide-react'
import { useAppSettings } from '@/hooks/use-app-settings'

type TableFormData = {
  table_number: string
  capacity: string
  location: string
  status: TableStatus
}

const tableStatuses = ['available', 'occupied', 'reserved', 'cleaning'] as const

export default function EditTablePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { settings, loading: settingsLoading } = useAppSettings()
  
  const [formData, setFormData] = useState<TableFormData>({
    table_number: '',
    capacity: '',
    location: '',
    status: 'available',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!settingsLoading && settings.features?.menu === false) router.replace('/dashboard')
  }, [router, settings.features?.menu, settingsLoading])

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const { data, error } = await supabase
          .from('tables')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (!data) throw new Error('Table not found')

        setFormData({
          table_number: data.table_number,
          capacity: data.capacity.toString(),
          location: data.location || '',
          status: data.status,
        })
      } catch (err) {
        console.error(err)
        setError('Failed to load table details')
      } finally {
        setFetching(false)
      }
    }

    if (id) {
      fetchTable()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('tables')
        .update({
          table_number: formData.table_number,
          capacity: parseInt(formData.capacity),
          location: formData.location,
          status: formData.status,
        })
        .eq('id', id)

      if (error) throw error

      router.push('/dashboard/tables')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update table')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this table?')) return

    setLoading(true)
    try {
        const { error } = await supabase
            .from('tables')
            .delete()
            .eq('id', id)
        
        if (error) throw error
        
        router.push('/dashboard/tables')
        router.refresh()
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete table')
        setLoading(false)
    }
  }

  if (fetching) {
      return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/tables" className="text-primary hover:underline">
            ← Back
            </Link>
            <h1 className="text-3xl font-bold">Edit Table</h1>
        </div>
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50"
            title="Delete Table"
        >
            <Trash2 className="w-5 h-5" />
        </button>
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
              Current Status
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
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
