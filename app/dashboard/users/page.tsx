import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersClient } from './users-client'
import { getRolePermissions } from '@/app/actions/permissions'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'owner') {
    redirect('/dashboard')
  }

  const [usersResult, permissionsResult] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('tenant_id', currentUser.tenant_id)
      .order('created_at', { ascending: false }),
    getRolePermissions(currentUser.tenant_id)
  ])

  const users = usersResult.data

  return <UsersClient 
    users={users || []} 
    currentUser={currentUser} 
    rolePermissions={permissionsResult} 
  />
}
