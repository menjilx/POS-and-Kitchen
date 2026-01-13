'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase/client'
import { Loader2, Search } from 'lucide-react'
import { DataTable } from '../../../../components/data-table'
import { getColumns, UserWithTenant } from './columns'
import { impersonateUser } from '@/app/actions/impersonate'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserWithTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')

  const loadUsers = useCallback(async () => {
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
  }, [toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.tenants?.name?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    )
  })

  const tenantOptions = useMemo(() => {
    const map = new Map<string, string>()
    users.forEach((u) => {
      if (u.tenants?.id && u.tenants?.name) map.set(u.tenants.id, u.tenants.name)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [users])

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

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users, tenants, or roles..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select value={selectedTenant || '__all__'} onValueChange={(v) => setSelectedTenant(v === '__all__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Tenants</SelectItem>
                {tenantOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
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
