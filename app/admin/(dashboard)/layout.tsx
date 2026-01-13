import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import AdminDashboardShell from '@/components/admin-dashboard-layout'

async function getSuperAdminStatus() {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { isSuperAdmin: false, user: null }
  }
  
  const { data: isSuperAdmin } = await supabase.rpc('is_superadmin')
  return { isSuperAdmin: isSuperAdmin === true, user }
}

export default async function AdminDashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSuperAdmin, user } = await getSuperAdminStatus()

  if (!isSuperAdmin || !user) {
    redirect('/admin/login')
  }

  return (
    <AdminDashboardShell email={user.email}>
      {children}
    </AdminDashboardShell>
  )
}
