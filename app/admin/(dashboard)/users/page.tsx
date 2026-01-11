'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { getColumns, UserWithTenant } from './columns'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithTenant[]>([])
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
      setUsers(((data ?? []) as unknown) as UserWithTenant[])
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

  const handleImpersonate = useCallback(async (userId: string) => {
    if (!confirm('You will be logged in as this user. Continue?')) return

    try {
      await supabase.auth.signOut()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'system@internal.admin',
        password: process.env.NEXT_PUBLIC_SUPERADMIN_PASSWORD || '',
      })

      if (signInError) throw signInError

      router.push(`/dashboard?impersonate=${userId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to impersonate user')
    }
  }, [router])

  const columns = useMemo(() => getColumns(handleImpersonate), [handleImpersonate])

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
            {[...new Set(users.map((u) => u.tenants?.id).filter(Boolean))].map((tenantId) => {
              const tenant = users.find((u) => u.tenants?.id === tenantId)?.tenants
              return tenant ? (
                <option key={tenantId} value={tenantId}>
                  {tenant.name}
                </option>
              ) : null
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers.filter((user) => (!selectedTenant ? true : user.tenants?.id === selectedTenant))}
        />
      )}
    </div>
  )
}
