'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function EditSupplierPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          setFormData({
            name: data.name || '',
            contact_person: data.contact_person || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            notes: data.notes || '',
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load supplier')
      } finally {
        setFetching(false)
      }
    }

    if (id) {
      fetchSupplier()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('suppliers')
        .update({
          name: formData.name,
          contact_person: formData.contact_person,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
        })
        .eq('id', id)

      if (error) throw error

      router.push('/dashboard/suppliers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update supplier')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/suppliers" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Supplier</h1>
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
              Supplier Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Fresh Produce Co."
            />
          </div>

          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium mb-2">
              Contact Person
            </label>
            <input
              id="contact_person"
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., John Smith"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="contact@supplier.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 234 567 8900"
              />
            </div>
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
              placeholder="123 Main St, City, State, ZIP"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Any additional notes about this supplier..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Supplier'}
          </button>
        </form>
      </div>
    </div>
  )
}
