'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Permission, DEFAULT_ROLE_PERMISSIONS, ROLES, buildPermissionsByRole } from '@/lib/permissions'

export async function getRolePermissions(tenantId: string) {
  const supabase = await createClient()
  
  const { data: customPermissions, error } = await supabase
    .from('role_permissions')
    .select('role, permissions')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error fetching permissions:', error)
    return {
      roles: Object.keys(DEFAULT_ROLE_PERMISSIONS),
      permissionsByRole: DEFAULT_ROLE_PERMISSIONS
    }
  }

  const permissionsByRole: Record<string, Permission[]> = buildPermissionsByRole(customPermissions)

  const roles = Array.from(new Set([
    ...Object.keys(permissionsByRole),
    ...Object.values(ROLES),
  ]))

  return { roles, permissionsByRole }
}

export async function updateRolePermissions(role: string, permissions: Permission[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // Check if user is owner
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'owner') {
    throw new Error('Unauthorized: Only owners can manage permissions')
  }

  const { error } = await supabase
    .from('role_permissions')
    .upsert({
      tenant_id: currentUser.tenant_id,
      role,
      permissions
    }, {
      onConflict: 'tenant_id, role'
    })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/users')
  return { success: true }
}
