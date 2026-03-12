import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MenuGrid } from '@/components/menu/menu-grid'

export default async function ItemsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const [
    { data: menuItems },
    { data: menuSetting },
    { data: currencySetting }
  ] = await Promise.all([
    supabase
      .from('menu_items')
      .select('*')
      .eq('item_type', 'simple')
      .order('name'),
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'features_menu')
      .single(),
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'currency')
      .single()
  ])

  const menuEnabled = menuSetting?.value !== 'false'
  if (!menuEnabled) redirect('/dashboard')
  const currency = currencySetting?.value ?? 'USD'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Simple Items</h1>
        <div className="flex gap-4">
          <Link
            href="/dashboard/items/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Add Simple Item
          </Link>
        </div>
      </div>

      <MenuGrid items={menuItems || []} currency={currency} />
    </div>
  )
}
