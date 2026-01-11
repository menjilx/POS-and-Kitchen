import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MenuGrid } from '@/components/menu/menu-grid'

export default async function MenuPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const [
    { data: menuItems },
    { data: tenantData }
  ] = await Promise.all([
    supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('name'),
    supabase
      .from('tenants')
      .select('settings')
      .eq('id', userData.tenant_id)
      .single()
  ])

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Menu</h1>
        <div className="flex gap-4">
          <Link
            href="/dashboard/menu/categories"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Manage Categories
          </Link>
          <Link
            href="/dashboard/menu/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Add Menu Item
          </Link>
        </div>
      </div>

      <MenuGrid items={menuItems || []} currency={currency} />
    </div>
  )
}
