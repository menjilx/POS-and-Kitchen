'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DataTable } from '@/components/data-table'
import { getColumns, Tenant } from './columns'

type TenantSettingsRow = {
  id: string
  settings: { currency?: string } | null
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const loadTenants = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_all_tenants')
      if (error) throw error

      const baseTenants = (data || []) as Tenant[]
      const tenantIds = baseTenants.map((t) => t.id).filter(Boolean)

      const { data: settingsRows, error: settingsError } = await supabase
        .from('tenants')
        .select('id, settings')
        .in('id', tenantIds)
        .returns<TenantSettingsRow[]>()
      if (settingsError) throw settingsError

      const currencyByTenantId = new Map<string, string>()
      ;(settingsRows ?? []).forEach((row) => {
        currencyByTenantId.set(row.id, row.settings?.currency ?? 'USD')
      })

      setTenants(
        baseTenants.map((t) => ({
          ...t,
          currency: currencyByTenantId.get(t.id) ?? 'USD',
        }))
      )
    } catch (err) {
      console.error('Failed to load tenants:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  const handleSuspend = async () => {
    if (!selectedTenant || !suspendReason) return

    try {
      const { error } = await supabase.rpc('suspend_tenant', {
        p_tenant_id: selectedTenant.id,
        p_reason: suspendReason,
      })

      if (error) throw error

      await loadTenants()
      setShowSuspendModal(false)
      setSelectedTenant(null)
      setSuspendReason('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to suspend tenant')
    }
  }

  const handleReactivate = useCallback(async (tenantId: string) => {
    try {
      const { error } = await supabase.rpc('reactivate_tenant', {
        p_tenant_id: tenantId,
      })

      if (error) throw error

      await loadTenants()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reactivate tenant')
    }
  }, [loadTenants])

  const columns = useMemo(() => getColumns(
    (tenant) => {
      setSelectedTenant(tenant)
      setShowSuspendModal(true)
    },
    handleReactivate,
    (tenant) => {
      setSelectedTenant(tenant)
      setShowDeleteModal(true)
    }
  ), [handleReactivate])

  const handleDelete = async () => {
    if (!selectedTenant) return

    if (!confirm(`Are you sure you want to delete "${selectedTenant.name}"? This will permanently delete ALL data including sales, inventory, users, etc.`)) {
      return
    }

    try {
      const { error } = await supabase.rpc('delete_tenant', {
        p_tenant_id: selectedTenant.id,
      })

      if (error) throw error

      await loadTenants()
      setShowDeleteModal(false)
      setSelectedTenant(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tenant')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage all restaurant accounts</p>
        </div>
        <button
          onClick={() => setShowSuspendModal(true)}
          disabled={showSuspendModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus size={16} />
          <span>Add Tenant</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      ) : (
        <DataTable columns={columns} data={tenants} />
      )}

      {showSuspendModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {selectedTenant.is_suspended ? 'Reactivate Tenant' : 'Suspend Tenant'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedTenant.name} - {selectedTenant.email}
            </p>
            {selectedTenant.suspension_reason && (
              <div className="p-3 bg-red-50 rounded-md mb-4">
                <p className="text-sm">
                  <span className="font-medium">Previous reason:</span> {selectedTenant.suspension_reason}
                </p>
              </div>
            )}
            {!selectedTenant.is_suspended && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Suspension Reason
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Reason for suspension..."
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false)
                  setSelectedTenant(null)
                  setSuspendReason('')
                }}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
              {!selectedTenant.is_suspended ? (
                <button
                  onClick={handleSuspend}
                  disabled={!suspendReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(selectedTenant.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600">Delete Tenant</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTenant.name} - {selectedTenant.email}
                </p>
                {selectedTenant.user_count > 0 && (
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    Warning: This will delete {selectedTenant.user_count} user accounts!
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-red-700 mb-4">
              This action is irreversible. All data including:
            </p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• All sales records</li>
              <li>• All inventory and stock</li>
              <li>• All menu items and recipes</li>
              <li>• All users</li>
              <li>• All reservations</li>
              <li>• All expenses</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedTenant(null)
                }}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
