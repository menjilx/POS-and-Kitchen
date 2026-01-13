'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase/client'
import { useTenantSettings } from '@/hooks/use-tenant-settings'
import { DailySalesChart } from '@/components/dashboard/daily-sales-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

type DailySalesRow = {
  sale_date: string
  total_amount: number
}

type DashboardState = {
  todaySalesTotal: number
  todayOrderCount: number
  yesterdaySalesTotal: number
  yesterdayOrderCount: number
  monthSalesTotal: number
  monthOrderCount: number
  prevMonthSalesTotal: number
  prevMonthOrderCount: number
  totalStockValue: number
  lowStockCount: number
  daily: { date: string; total: number }[]
  lowStock: { name: string; unit: string; quantity: number; reorderLevel: number }[]
  topSelling: { name: string; quantity: number; revenue: number }[]
}

function isoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { settings, formatCurrency } = useTenantSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<DashboardState>({
    todaySalesTotal: 0,
    todayOrderCount: 0,
    yesterdaySalesTotal: 0,
    yesterdayOrderCount: 0,
    monthSalesTotal: 0,
    monthOrderCount: 0,
    prevMonthSalesTotal: 0,
    prevMonthOrderCount: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    daily: [],
    lowStock: [],
    topSelling: [],
  })

  const formatPercent = useCallback((value: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value)
  }, [])

  const getDelta = useCallback((current: number, previous: number) => {
    if (previous <= 0) return null
    return (current - previous) / previous
  }, [])

  const KpiCard = useCallback(
    ({
      title,
      value,
      delta,
      footerTitle,
      footerSubtitle,
    }: {
      title: string
      value: ReactNode
      delta: number | null
      footerTitle: string
      footerSubtitle: string
    }) => {
      const isUp = typeof delta === 'number' ? delta >= 0 : true
      const BadgeIcon = isUp ? TrendingUpIcon : TrendingDownIcon
      const FooterIcon = isUp ? TrendingUpIcon : TrendingDownIcon
      const badgeText =
        typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${formatPercent(delta)}` : null

      return (
        <Card className="@container/card bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
          <CardHeader className="relative">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{value}</CardTitle>
            {badgeText ? (
              <div className="absolute right-4 top-4">
                <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                  <BadgeIcon className="size-3" />
                  {badgeText}
                </Badge>
              </div>
            ) : null}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footerTitle} <FooterIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">{footerSubtitle}</div>
          </CardFooter>
        </Card>
      )
    },
    [formatPercent]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
      if (userError) throw userError
      if (!userData?.tenant_id) return

      const tenantId = userData.tenant_id
      const today = new Date()
      const todayIso = isoDateUTC(today)
      const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1))
      const yesterdayIso = isoDateUTC(yesterday)
      const start30 = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      start30.setUTCDate(start30.getUTCDate() - 29)
      const start30Iso = isoDateUTC(start30)

      const startMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
      const startMonthIso = isoDateUTC(startMonth)

      const prevMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1))
      const prevMonthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0))
      const prevMonthStartIso = isoDateUTC(prevMonthStart)
      const prevMonthEndIso = isoDateUTC(prevMonthEnd)

      const [salesRes, stockRes, salesItemsRes, prevMonthSalesRes] = await Promise.all([
        supabase
          .from('sales')
          .select('sale_date,total_amount')
          .eq('tenant_id', tenantId)
          .neq('payment_status', 'refunded')
          .gte('sale_date', start30Iso)
          .order('sale_date', { ascending: true }),
        supabase
          .from('stock')
          .select('ingredient_id, quantity, ingredients (name, unit, cost_per_unit, reorder_level)')
          .eq('tenant_id', tenantId),
        supabase
          .from('sales')
          .select('sale_items (quantity, total_price, menu_items (name))')
          .eq('tenant_id', tenantId)
          .neq('payment_status', 'refunded')
          .gte('sale_date', start30Iso)
          .order('sale_date', { ascending: false })
          .limit(250),
        supabase
          .from('sales')
          .select('sale_date,total_amount')
          .eq('tenant_id', tenantId)
          .neq('payment_status', 'refunded')
          .gte('sale_date', prevMonthStartIso)
          .lte('sale_date', prevMonthEndIso),
      ])

      if (salesRes.error) throw salesRes.error
      if (stockRes.error) throw stockRes.error
      if (salesItemsRes.error) throw salesItemsRes.error
      if (prevMonthSalesRes.error) throw prevMonthSalesRes.error

      const rows = ((salesRes.data ?? []) as unknown) as DailySalesRow[]

      let todaySalesTotal = 0
      let todayOrderCount = 0
      let yesterdaySalesTotal = 0
      let yesterdayOrderCount = 0
      let monthSalesTotal = 0
      let monthOrderCount = 0

      const totalsByDay = new Map<string, number>()
      rows.forEach((r) => {
        const dateKey = r.sale_date
        const amount = Number(r.total_amount) || 0
        totalsByDay.set(dateKey, (totalsByDay.get(dateKey) ?? 0) + amount)

        if (dateKey === todayIso) {
          todaySalesTotal += amount
          todayOrderCount += 1
        }
        if (dateKey === yesterdayIso) {
          yesterdaySalesTotal += amount
          yesterdayOrderCount += 1
        }
        if (dateKey >= startMonthIso) {
          monthSalesTotal += amount
          monthOrderCount += 1
        }
      })

      const prevMonthRows = ((prevMonthSalesRes.data ?? []) as unknown) as DailySalesRow[]
      let prevMonthSalesTotal = 0
      let prevMonthOrderCount = 0
      prevMonthRows.forEach((r) => {
        prevMonthSalesTotal += Number(r.total_amount) || 0
        prevMonthOrderCount += 1
      })

      const daily: { date: string; total: number }[] = []
      const cursor = new Date(Date.UTC(start30.getUTCFullYear(), start30.getUTCMonth(), start30.getUTCDate()))
      const endUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      while (cursor <= endUtc) {
        const key = isoDateUTC(cursor)
        daily.push({
          date: new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          total: totalsByDay.get(key) ?? 0,
        })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }

      const stockRows =
        (((stockRes.data ?? []) as unknown) as {
          ingredient_id: string
          quantity: number
          ingredients: { name: string; unit: string; cost_per_unit: number; reorder_level: number } | null
        }[]) ?? []

      let totalStockValue = 0
      const qtyByIngredient = new Map<string, number>()
      const ingredientMeta = new Map<
        string,
        { name: string; unit: string; reorderLevel: number; costPerUnit: number }
      >()

      for (const row of stockRows) {
        const qty = Number(row.quantity) || 0
        const ingredient = row.ingredients

        if (ingredient) {
          const cost = Number(ingredient.cost_per_unit) || 0
          totalStockValue += qty * cost
          if (!ingredientMeta.has(row.ingredient_id)) {
            ingredientMeta.set(row.ingredient_id, {
              name: ingredient.name,
              unit: ingredient.unit,
              reorderLevel: Number(ingredient.reorder_level) || 0,
              costPerUnit: cost,
            })
          }
        }

        qtyByIngredient.set(row.ingredient_id, (qtyByIngredient.get(row.ingredient_id) ?? 0) + qty)
      }

      const lowStock = Array.from(qtyByIngredient.entries())
        .map(([ingredientId, quantity]) => {
          const meta = ingredientMeta.get(ingredientId)
          return meta
            ? {
                name: meta.name,
                unit: meta.unit,
                quantity,
                reorderLevel: meta.reorderLevel,
              }
            : null
        })
        .filter((v): v is { name: string; unit: string; quantity: number; reorderLevel: number } => Boolean(v))
        .filter((v) => v.reorderLevel > 0 && v.quantity < v.reorderLevel)
        .sort((a, b) => (a.quantity / a.reorderLevel) - (b.quantity / b.reorderLevel))

      const lowStockCount = lowStock.length

      const salesForItems =
        (((salesItemsRes.data ?? []) as unknown) as {
          sale_items: { quantity: number; total_price: number; menu_items: { name: string } | null }[] | null
        }[]) ?? []

      const byMenuItem = new Map<string, { quantity: number; revenue: number }>()
      for (const sale of salesForItems) {
        for (const item of sale.sale_items ?? []) {
          const name = item.menu_items?.name
          if (!name) continue
          const prev = byMenuItem.get(name) ?? { quantity: 0, revenue: 0 }
          byMenuItem.set(name, {
            quantity: prev.quantity + (Number(item.quantity) || 0),
            revenue: prev.revenue + (Number(item.total_price) || 0),
          })
        }
      }

      const topSelling = Array.from(byMenuItem.entries())
        .map(([name, agg]) => ({ name, quantity: agg.quantity, revenue: agg.revenue }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      setState({
        todaySalesTotal,
        todayOrderCount,
        yesterdaySalesTotal,
        yesterdayOrderCount,
        monthSalesTotal,
        monthOrderCount,
        prevMonthSalesTotal,
        prevMonthOrderCount,
        totalStockValue,
        lowStockCount,
        daily,
        lowStock: lowStock.slice(0, 5),
        topSelling,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const avgOrderValue = useMemo(() => {
    if (state.todayOrderCount <= 0) return 0
    return state.todaySalesTotal / state.todayOrderCount
  }, [state.todayOrderCount, state.todaySalesTotal])

  const todaySalesDelta = useMemo(
    () => getDelta(state.todaySalesTotal, state.yesterdaySalesTotal),
    [getDelta, state.todaySalesTotal, state.yesterdaySalesTotal]
  )
  const todayOrdersDelta = useMemo(
    () => getDelta(state.todayOrderCount, state.yesterdayOrderCount),
    [getDelta, state.todayOrderCount, state.yesterdayOrderCount]
  )
  const monthSalesDelta = useMemo(
    () => getDelta(state.monthSalesTotal, state.prevMonthSalesTotal),
    [getDelta, state.monthSalesTotal, state.prevMonthSalesTotal]
  )

  const currency = settings.currency || 'USD'

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of today’s performance</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Couldn’t load dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of today’s performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Today’s Sales"
          value={formatCurrency(state.todaySalesTotal)}
          delta={todaySalesDelta}
          footerTitle={todaySalesDelta !== null && todaySalesDelta < 0 ? 'Trending down today' : 'Trending up today'}
          footerSubtitle={`Yesterday: ${formatCurrency(state.yesterdaySalesTotal)}`}
        />
        <KpiCard
          title="Orders Today"
          value={state.todayOrderCount}
          delta={todayOrdersDelta}
          footerTitle={todayOrdersDelta !== null && todayOrdersDelta < 0 ? 'Fewer orders than yesterday' : 'More orders than yesterday'}
          footerSubtitle={`Yesterday: ${state.yesterdayOrderCount} orders`}
        />
        <KpiCard
          title="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          delta={null}
          footerTitle="Average check size"
          footerSubtitle="Calculated from today’s orders"
        />
        <KpiCard
          title="Month-to-Date Sales"
          value={new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(state.monthSalesTotal)}
          delta={monthSalesDelta}
          footerTitle={monthSalesDelta !== null && monthSalesDelta < 0 ? 'Down vs last month' : 'Up vs last month'}
          footerSubtitle={`${state.monthOrderCount} orders this month`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          title="Total Stock Value"
          value={formatCurrency(state.totalStockValue)}
          delta={null}
          footerTitle="Inventory snapshot"
          footerSubtitle="Based on current stock and unit costs"
        />
        <KpiCard
          title="Low Stock Items"
          value={state.lowStockCount}
          delta={null}
          footerTitle={state.lowStockCount > 0 ? 'Reorder needed' : 'Stock levels healthy'}
          footerSubtitle="Items below reorder level"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Sales (Last 30 Days)</CardTitle>
          <CardDescription>Sales revenue per day</CardDescription>
        </CardHeader>
        <CardContent>
          <DailySalesChart data={state.daily} currency={currency} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Ingredients</CardTitle>
            <CardDescription>Items below reorder level</CardDescription>
          </CardHeader>
          <CardContent>
            {state.lowStock.length === 0 ? (
              <div className="text-sm text-muted-foreground">No low stock items</div>
            ) : (
              <div className="space-y-2">
                {state.lowStock.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {item.quantity.toFixed(2)} {item.unit} / {item.reorderLevel.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Last 30 days (by quantity)</CardDescription>
          </CardHeader>
          <CardContent>
            {state.topSelling.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sales data</div>
            ) : (
              <div className="space-y-2">
                {state.topSelling.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {item.quantity} · {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
