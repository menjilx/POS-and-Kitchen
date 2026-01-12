import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { DailySalesChart } from '@/components/dashboard/daily-sales-chart'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { DisplayStatusCard, type DisplayStatusRow } from '@/components/dashboard/display-status-card'

type TodaySaleRow = {
  total_amount: number | string
}

type RecentSaleRow = {
  id: string
  order_number: string
  total_amount: number | string
  sale_time: string
  sale_type: string
}

type DailySaleRow = {
  sale_date: string
  total_amount: number | string
}

type ProfitLossRow = {
  period_start: string
  period_end: string
  revenue: number | string
  cost_of_goods_sold: number | string
  operating_expenses: number | string
  gross_profit: number | string
  net_profit: number | string
}

type MenuPerformanceRow = {
  menu_item_id: string
  menu_item_name: string
  quantity_sold: number | string
  total_revenue: number | string
  total_cost: number | string
  total_margin: number | string
  margin_percentage: number | string
}

type DisplayRow = {
  id: string
  name: string
  token: string | null
}

type KdsOrderRow = {
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  priority: 'normal' | 'high' | 'urgent'
  assigned_station: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

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

  const { data: tenantData } = tenantId
    ? await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single()
    : { data: null }

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  const now = new Date()
  const todayIsoDate = now.toISOString().split('T')[0]
  const sevenDaysAgoIso = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgoDate = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
  const yesterdayDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthStartIsoDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const [
    { data: todaySales },
    { data: yesterdaySales },
    { data: profitLossRows },
    { data: totalOrders },
    { data: topMenuItems },
    { data: recentSales },
    { data: dailySales },
    { data: displays },
    { data: openKdsOrders },
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .eq('sale_date', todayIsoDate),
    supabase
      .from('sales')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .eq('sale_date', yesterdayDate),
    supabase
      .rpc('get_profit_loss', {
        p_tenant_id: tenantId,
        p_start_date: monthStartIsoDate,
        p_end_date: todayIsoDate,
      }),
    supabase
      .from('sales')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('sale_date', todayIsoDate),
    supabase
      .rpc('get_menu_performance', { p_tenant_id: tenantId, p_days: 7 }),
    supabase
      .from('sales')
      .select('id, order_number, total_amount, sale_time, sale_type')
      .eq('tenant_id', tenantId)
      .gte('created_at', sevenDaysAgoIso)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('sales')
      .select('sale_date, total_amount')
      .eq('tenant_id', tenantId)
      .gte('sale_date', thirtyDaysAgoDate.toISOString().split('T')[0]),
    supabase
      .from('kitchen_displays')
      .select('id, name, token')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true }),
    supabase
      .from('kds_orders')
      .select('status, priority, assigned_station, created_at, started_at, completed_at')
      .eq('tenant_id', tenantId)
      .not('status', 'eq', 'served')
      .not('status', 'eq', 'cancelled'),
  ])

  const todaySalesRows = (todaySales ?? []) as unknown as TodaySaleRow[]
  const yesterdaySalesRows = (yesterdaySales ?? []) as unknown as TodaySaleRow[]
  const todaySalesTotal = todaySalesRows.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const yesterdaySalesTotal = yesterdaySalesRows.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const totalOrderCount = totalOrders?.length || 0
  const recentSalesRows = (recentSales ?? []) as unknown as RecentSaleRow[]

  const profitLoss = (profitLossRows ?? []) as unknown as ProfitLossRow[]
  const netProfitMtd = profitLoss[0]?.net_profit ?? 0

  const menuPerformanceRows = (topMenuItems ?? []) as unknown as MenuPerformanceRow[]
  const topMenu = menuPerformanceRows
    .filter((row) => Number(row.quantity_sold) > 0)
    .slice(0, 5)

  const displayRows = (displays ?? []) as unknown as DisplayRow[]
  const openOrders = (openKdsOrders ?? []) as unknown as KdsOrderRow[]

  const displayStatusRows: DisplayStatusRow[] = displayRows.map((display) => {
    const displayName = display.name.trim()
    const displayNameLower = displayName.toLowerCase()
    const isKitchenLike = displayNameLower.includes('kitchen')

    const stationOrders = openOrders.filter((order) => {
      const stationNameLower = (order.assigned_station ?? '').trim().toLowerCase()
      if (isKitchenLike) return order.assigned_station === null || stationNameLower.includes('kitchen')
      return order.assigned_station?.trim() === displayName
    })

    const pendingOrders = stationOrders.filter((o) => o.status === 'pending').length
    const preparingOrders = stationOrders.filter((o) => o.status === 'preparing').length
    const readyOrders = stationOrders.filter((o) => o.status === 'ready').length
    const urgentOrders = stationOrders.filter((o) => o.priority === 'urgent').length

    const oldestCreatedAt = stationOrders
      .map((o) => o.created_at)
      .sort((a, b) => a.localeCompare(b))[0]
    const oldestOrderMinutes = oldestCreatedAt
      ? Math.max(0, Math.floor((now.getTime() - new Date(oldestCreatedAt).getTime()) / 60000))
      : null

    const lastActivityIso = stationOrders
      .flatMap((o) => [o.created_at, o.started_at, o.completed_at].filter(Boolean) as string[])
      .sort((a, b) => b.localeCompare(a))[0] ?? null

    return {
      stationName: display.name,
      openHref: display.token ? `/kds?token=${display.token}` : null,
      isActive: stationOrders.length > 0,
      openOrders: stationOrders.length,
      pendingOrders,
      preparingOrders,
      readyOrders,
      urgentOrders,
      oldestOrderMinutes,
      lastActivityIso,
    }
  })

  const totalOpenOrders = displayStatusRows.reduce((sum, r) => sum + r.openOrders, 0)
  const totalUrgentOrders = displayStatusRows.reduce((sum, r) => sum + r.urgentOrders, 0)
  const totalReadyOrders = displayStatusRows.reduce((sum, r) => sum + r.readyOrders, 0)

  const dailyRows = (dailySales ?? []) as unknown as DailySaleRow[]
  const totalsByDate = dailyRows.reduce((acc, row) => {
    const key = row.sale_date
    acc[key] = (acc[key] ?? 0) + Number(row.total_amount)
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(totalsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoDate, total]) => ({
      date: format(new Date(isoDate), 'MMM dd'),
      total,
    }))

  const salesTrend = yesterdaySalesTotal > 0
    ? ((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100
    : 0

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="relative">
            <CardDescription>Today&apos;s Sales</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(todaySalesTotal, currency)}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                {salesTrend >= 0 ? (
                  <>
                    <TrendingUpIcon className="size-3" />
                    +{salesTrend.toFixed(1)}%
                  </>
                ) : (
                  <>
                    <TrendingDownIcon className="size-3" />
                    {salesTrend.toFixed(1)}%
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-col items-start gap-1 text-sm">
            <div className="flex gap-2 font-medium">
              {salesTrend >= 0 ? (
                <>Up from yesterday <TrendingUpIcon className="size-4" /></>
              ) : (
                <>Down from yesterday <TrendingDownIcon className="size-4" /></>
              )}
            </div>
            <div className="text-muted-foreground">
              Total sales for today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Orders Today</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {totalOrderCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-col items-start gap-1 text-sm">
            <div className="flex gap-2 font-medium">
              Orders processed
            </div>
            <div className="text-muted-foreground">
              Completed transactions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Net Profit (MTD)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(Number(netProfitMtd || 0), currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-col items-start gap-1 text-sm">
            <div className="flex gap-2 font-medium">
              Month to date profit
            </div>
            <div className="text-muted-foreground">
              Total profit this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Avg Order Value</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalOrderCount > 0 ? todaySalesTotal / totalOrderCount : 0, currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-col items-start gap-1 text-sm">
            <div className="flex gap-2 font-medium">
              Average transaction
            </div>
            <div className="text-muted-foreground">
              Per order today
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Sales (Last 30 Days)</CardTitle>
          <CardDescription>Sales revenue per day</CardDescription>
        </CardHeader>
        <CardContent>
          <DailySalesChart data={chartData} currency={currency} />
        </CardContent>
      </Card>

      <DisplayStatusCard
        rows={displayStatusRows}
        totalOpenOrders={totalOpenOrders}
        totalUrgentOrders={totalUrgentOrders}
        totalReadyOrders={totalReadyOrders}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Menu Items (7 Days)</CardTitle>
            <CardDescription>Most sold items this week</CardDescription>
          </CardHeader>
          <CardContent>
            {topMenu.length > 0 ? (
              <ul className="space-y-3">
                {topMenu.map((item) => {
                  const quantitySold = Number(item.quantity_sold) || 0
                  const totalRevenue = Number(item.total_revenue) || 0
                  const marginPct = Number(item.margin_percentage)
                  const marginPctDisplay = Number.isFinite(marginPct) ? marginPct : 0

                  return (
                    <li key={item.menu_item_id} className="flex justify-between items-center text-sm py-2 border-b last:border-0 gap-4">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{item.menu_item_name}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(totalRevenue, currency)} revenue · {marginPctDisplay.toFixed(1)}% margin
                        </div>
                      </div>
                      <Badge variant="outline" className="px-1.5 text-muted-foreground tabular-nums shrink-0">
                        {quantitySold} sold
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground">No sales data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions from the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSalesRows.length > 0 ? (
              <div className="space-y-2">
                {recentSalesRows.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="flex flex-col">
                      <span className="font-medium">{sale.order_number}</span>
                      <span className="text-xs text-muted-foreground capitalize">{sale.sale_type.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(Number(sale.total_amount), currency)}</span>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(sale.sale_time), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent sales</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
