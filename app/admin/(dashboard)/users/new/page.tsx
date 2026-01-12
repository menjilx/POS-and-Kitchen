'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin as supabase } from '@/lib/supabase/client'

export default function AdminAddSuperadminPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create auth user with superadmin role and NO tenant_id
      // The trigger will automatically create the public user profile with tenant_id = NULL
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).substring(2, 10),
        options: {
          data: {
            full_name: formData.fullName,
            role: 'superadmin',
            superadmin: true,
            tenant_id: null,
          },
        },
      })

      if (authError) throw authError

      router.push('/admin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add superadmin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin" className="text-primary hover:underline">
          ← Back
        </a>
        <h1 className="text-3xl font-bold">Add Super Admin</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Super Admin Name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@kitchensystem.com"
            />
          </div>

          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-2">Note:</p>
            <p>This creates:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>A new global superadmin account</li>
              <li>They will have full access to all tenants</li>
              <li>No specific tenant is assigned</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              The superadmin will receive a random password. They can reset it via email.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Super Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
