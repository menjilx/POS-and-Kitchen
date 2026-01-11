import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { DailySalesChart } from '@/components/dashboard/daily-sales-chart'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

type TodaySaleRow = {
  total_amount: number | string
}

type TopMenuItemRow = {
  quantity: number | string
  menu_items: { name: string } | null
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

  const [
    { data: todaySales },
    { data: yesterdaySales },
    { data: netProfit },
    { data: totalOrders },
    { data: topMenuItems },
    { data: recentSales },
    { data: dailySales },
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
      .rpc('get_net_profit_ytd', { p_tenant_id: tenantId }),
    supabase
      .from('sales')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('sale_date', todayIsoDate),
    supabase
      .from('sale_items')
      .select('quantity, menu_items (name)')
      .gte('created_at', sevenDaysAgoIso)
      .order('quantity', { ascending: false })
      .limit(5),
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
  ])

  const todaySalesRows = (todaySales ?? []) as unknown as TodaySaleRow[]
  const yesterdaySalesRows = (yesterdaySales ?? []) as unknown as TodaySaleRow[]
  const todaySalesTotal = todaySalesRows.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const yesterdaySalesTotal = yesterdaySalesRows.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const totalOrderCount = totalOrders?.length || 0

  const topMenuRows = (topMenuItems ?? []) as unknown as TopMenuItemRow[]
  const recentSalesRows = (recentSales ?? []) as unknown as RecentSaleRow[]

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
            <CardDescription>Net Profit (YTD)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(Number(netProfit || 0), currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-col items-start gap-1 text-sm">
            <div className="flex gap-2 font-medium">
              Year to date profit
            </div>
            <div className="text-muted-foreground">
              Total profit this year
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Menu Items (7 Days)</CardTitle>
            <CardDescription>Most sold items this week</CardDescription>
          </CardHeader>
          <CardContent>
            {topMenuRows.length > 0 ? (
              <ul className="space-y-3">
                {topMenuRows.map((item, index) => (
                  <li key={index} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                    <span className="font-medium">{item.menu_items?.name}</span>
                    <Badge variant="outline" className="px-1.5 text-muted-foreground">
                      {item.quantity} sold
                    </Badge>
                  </li>
                ))}
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
