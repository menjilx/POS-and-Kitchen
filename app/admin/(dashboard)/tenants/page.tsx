'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { DataTable } from '../../../../components/data-table'
import { getColumns, Tenant } from './columns'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type TenantSettingsRow = {
  id: string
  settings: { currency?: string } | null
}

export default function AdminTenantsPage() {
  const { toast } = useToast()
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tenants. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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

      toast({
        title: "Tenant suspended",
        description: `${selectedTenant.name} has been suspended.`,
      })

      await loadTenants()
      setShowSuspendModal(false)
      setSelectedTenant(null)
      setSuspendReason('')
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to suspend tenant',
      })
    }
  }

  const handleReactivate = useCallback(async (tenantId: string) => {
    try {
      const { error } = await supabase.rpc('reactivate_tenant', {
        p_tenant_id: tenantId,
      })

      if (error) throw error

      toast({
        title: "Tenant reactivated",
        description: "The tenant has been successfully reactivated.",
      })

      await loadTenants()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to reactivate tenant',
      })
    }
  }, [loadTenants, toast])

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

    try {
      const { error } = await supabase.rpc('delete_tenant', {
        p_tenant_id: selectedTenant.id,
      })

      if (error) throw error

      toast({
        title: "Tenant deleted",
        description: `${selectedTenant.name} has been permanently deleted.`,
      })

      await loadTenants()
      setShowDeleteModal(false)
      setSelectedTenant(null)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete tenant',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage all restaurant accounts</p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants/new">
            <Plus className="h-4 w-4" />
            Add Tenant
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      ) : (
        <DataTable<Tenant, unknown> columns={columns} data={tenants} />
      )}

      <Dialog
        open={showSuspendModal && Boolean(selectedTenant)}
        onOpenChange={(open) => {
          setShowSuspendModal(open)
          if (!open) {
            setSelectedTenant(null)
            setSuspendReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTenant?.is_suspended ? 'Reactivate Tenant' : 'Suspend Tenant'}</DialogTitle>
            <DialogDescription>
              {selectedTenant ? `${selectedTenant.name} — ${selectedTenant.email}` : null}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant?.suspension_reason ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm">
              <span className="font-medium">Previous reason:</span> {selectedTenant.suspension_reason}
            </div>
          ) : null}

          {selectedTenant && !selectedTenant.is_suspended ? (
            <div className="space-y-2">
              <Label>Suspension Reason</Label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                placeholder="Reason for suspension..."
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendModal(false)
                setSelectedTenant(null)
                setSuspendReason('')
              }}
            >
              Cancel
            </Button>

            {selectedTenant && !selectedTenant.is_suspended ? (
              <Button variant="destructive" onClick={handleSuspend} disabled={!suspendReason}>
                Suspend
              </Button>
            ) : selectedTenant ? (
              <Button onClick={() => handleReactivate(selectedTenant.id)}>Reactivate</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteModal && Boolean(selectedTenant)}
        onOpenChange={(open) => {
          setShowDeleteModal(open)
          if (!open) setSelectedTenant(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Tenant
            </DialogTitle>
            <DialogDescription>
              {selectedTenant ? `${selectedTenant.name} — ${selectedTenant.email}` : null}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && selectedTenant.user_count > 0 ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Warning: This will delete {selectedTenant.user_count} user accounts.
            </div>
          ) : null}

          <div className="space-y-2 text-sm">
            <p className="font-medium text-destructive">This action is irreversible.</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• All sales records</li>
              <li>• All inventory and stock</li>
              <li>• All menu items and recipes</li>
              <li>• All users</li>
              <li>• All reservations</li>
              <li>• All expenses</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedTenant(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
