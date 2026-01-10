'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function InviteUserPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'staff',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async (e: React.FormEvent) => {
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

      const inviteUrl = `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.admin.inviteUserByEmail(formData.email, {
        redirectTo: inviteUrl,
        data: {
          tenant_id: userData.tenant_id,
          role: formData.role,
        },
      })

      if (error) throw error

      router.push('/dashboard/users?message=Invitation sent successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/users" className="text-primary hover:underline">
          ← Back
        </a>
        <h1 className="text-3xl font-bold">Invite User</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleInvite} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}
