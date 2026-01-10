import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  const tenantId = userData.tenant_id

  const [
    { data: totalStockValue },
    { data: lowStockItems },
    { data: todaySales },
    { data: netProfit },
    { data: topMenuItems },
  ] = await Promise.all([
    supabase
      .rpc('get_total_stock_value', { p_tenant_id: tenantId }),
    supabase
      .from('stock')
      .select(`
        ingredients (name, reorder_level),
        quantity
      `)
      .eq('tenant_id', tenantId)
      .lt('quantity', '10'),
    supabase
      .from('sales')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .eq('sale_date', new Date().toISOString().split('T')[0]),
    supabase
      .rpc('get_net_profit_ytd', { p_tenant_id: tenantId }),
    supabase
      .from('sale_items')
      .select('quantity, menu_items (name)')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('quantity', { ascending: false })
      .limit(5),
  ])

  const todaySalesTotal = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

  const kpis = [
    {
      title: 'Total Stock Value',
      value: `$${(totalStockValue || 0).toLocaleString()}`,
      description: 'Current inventory value',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems?.length || 0,
      description: 'Items below reorder level',
      alert: (lowStockItems?.length || 0) > 0,
    },
    {
      title: "Today's Sales",
      value: `$${todaySalesTotal.toLocaleString()}`,
      description: 'Sales so far today',
    },
    {
      title: 'Net Profit (YTD)',
      value: `$${(netProfit || 0).toLocaleString()}`,
      description: 'Year to date profit',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className={`p-6 bg-card rounded-lg border ${
              kpi.alert ? 'border-destructive' : ''
            }`}
          >
            <p className="text-sm text-muted-foreground">{kpi.title}</p>
            <p className="text-3xl font-bold mt-2">{kpi.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Low Stock Alert</h2>
          {lowStockItems && lowStockItems.length > 0 ? (
            <ul className="space-y-2">
              {lowStockItems.map((item: any, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{item.ingredients?.name}</span>
                  <span className="text-destructive font-medium">
                    {item.quantity} units
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No low stock items</p>
          )}
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Top Menu Items (7 Days)</h2>
          {topMenuItems && topMenuItems.length > 0 ? (
            <ul className="space-y-2">
              {topMenuItems.map((item: any, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{item.menu_items?.name}</span>
                  <span className="font-medium">{item.quantity} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No sales data available</p>
          )}
        </div>
      </div>
    </div>
  )
}
