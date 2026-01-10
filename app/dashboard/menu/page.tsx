import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Menu</h1>
        <a
          href="/dashboard/menu/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Menu Item
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems?.map((item) => {
          const margin = Number(item.contribution_margin)
          const marginPercent = Number(item.selling_price) > 0
            ? (margin / Number(item.selling_price)) * 100
            : 0
          const totalCostPercent = Number(item.selling_price) > 0
            ? (Number(item.total_cost) / Number(item.selling_price)) * 100
            : 0

          return (
            <div key={item.id} className="bg-card rounded-lg border p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{item.name}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selling Price:</span>
                  <span className="font-medium">${Number(item.selling_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-medium">${Number(item.total_cost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin:</span>
                  <span className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${margin.toFixed(2)} ({marginPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost %:</span>
                  <span className="font-medium">{totalCostPercent.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <a
                  href={`/dashboard/menu/${item.id}`}
                  className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                >
                  Edit
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
