'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function NewLocationPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
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

      const { error } = await supabase.from('locations').insert({
        tenant_id: userData.tenant_id,
        name: formData.name,
        address: formData.address,
      })

      if (error) throw error

      router.push('/dashboard/locations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/locations" className="text-primary hover:underline">
          ← Back
        </a>
        <h1 className="text-3xl font-bold">Add Location</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Location Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Main Kitchen, Warehouse, Restaurant"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Address
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Optional physical address..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Location'}
          </button>
        </form>
      </div>
    </div>
  )
}
