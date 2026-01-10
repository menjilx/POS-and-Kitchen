'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Eye, Shield, UserX, Search } from 'lucide-react'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          tenants (name, email, is_suspended)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.tenants?.name?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    )
  })

  const handleImpersonate = async (userId: string, tenantId: string) => {
    if (!confirm('You will be logged in as this user. Continue?')) return

    try {
      await supabase.auth.signOut()
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'system@internal.admin',
        password: process.env.NEXT_PUBLIC_SUPERADMIN_PASSWORD || '',
      })

      if (signInError) throw signInError

      router.push(`/dashboard?impersonate=${userId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to impersonate user')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">All Users</h1>
          <p className="text-muted-foreground">View and manage users across all tenants</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex gap-4 items-center">
          <Search className="text-muted-foreground" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users, tenants, or roles..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Tenants</option>
            {[...new Set(users.map(u => u.tenants?.id).filter(Boolean))].map(tenantId => {
              const tenant = users.find(u => u.tenants?.id === tenantId)?.tenants
              return tenant ? <option key={tenantId} value={tenantId}>{tenant.name}</option> : null
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Tenant</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Created</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-accent">
                  <td className="p-4">
                    <div className="font-medium">{user.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{user.tenants?.name || (user.role === 'superadmin' ? 'Global' : 'N/A')}</div>
                    {user.tenants?.is_suspended && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Suspended</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.status === 'active' ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Inactive</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleImpersonate(user.id, user.tenant_id || '')}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm"
                    >
                      <Eye size={16} />
                      Impersonate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No users found matching your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
