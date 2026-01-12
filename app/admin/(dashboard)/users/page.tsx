'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin as supabase } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { getColumns, UserWithTenant } from './columns'
import { impersonateUser } from '@/app/actions/impersonate'
import { useToast } from '@/hooks/use-toast'

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      })
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
      toast({
        title: "Impersonating...",
        description: "Please wait while we log you in as the user.",
      })

      const result = await impersonateUser(userId)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Sign out first to ensure clean state
      await supabase.auth.signOut()
      
      // Navigate to the magic link
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to impersonate user',
      })
    }
  }, [toast])

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
