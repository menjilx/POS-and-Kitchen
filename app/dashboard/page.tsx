'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'

import { supabase } from '@/lib/supabase/client'
import { useTenantSettings } from '@/hooks/use-tenant-settings'
import { DailySalesChart } from '@/components/dashboard/daily-sales-chart'
import { DisplayStatusCard, type DisplayStatusRow } from '@/components/dashboard/display-status-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import type { UserRole } from '@/types/database'

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
  displayStatusRows: DisplayStatusRow[]
  totalDisplayOpenOrders: number
  totalDisplayReadyOrders: number
  totalDisplayUrgentOrders: number
  upcomingReservations: {
    id: string
    customerName: string
    reservationTime: string
    partySize: number
    status: string
    tableNumber: string | null
  }[]
}

function isoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { settings, formatCurrency } = useTenantSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
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
    displayStatusRows: [],
    totalDisplayOpenOrders: 0,
    totalDisplayReadyOrders: 0,
    totalDisplayUrgentOrders: 0,
    upcomingReservations: [],
  })

  const loadDisplayStatus = useCallback(async () => {
    const [displaysRes, kdsOrdersRes] = await Promise.all([
      supabase
        .from('kitchen_displays')
        .select('id, name, token, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('kds_orders')
        .select('status, priority, assigned_station, created_at, started_at, completed_at')
        .not('status', 'eq', 'served')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: true }),
    ])

    if (displaysRes.error) throw displaysRes.error
    if (kdsOrdersRes.error) throw kdsOrdersRes.error

    const displays =
      (((displaysRes.data ?? []) as unknown) as {
        id: string
        name: string
        token: string | null
        created_at: string
      }[]) ?? []

    const kdsOrders =
      (((kdsOrdersRes.data ?? []) as unknown) as {
        status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
        priority: 'normal' | 'high' | 'urgent'
        assigned_station: string | null
        created_at: string
        started_at: string | null
        completed_at: string | null
      }[]) ?? []

    const stationMatchesKitchen = (station: string) => {
      return station.trim().toLowerCase().includes('kitchen')
    }

    const matchesStation = (display: { id: string, name: string }, orderAssignedStation: string | null) => {
      // 1. Direct ID match (New behavior)
      if (orderAssignedStation === display.id) return true

      // 2. Legacy/Name match handling
      // If assigned_station matches name (Legacy behavior)
      if (orderAssignedStation === display.name) return true
      
      // If assigned_station contains "kitchen" and display is "Kitchen" (Legacy fuzzy)
      if (orderAssignedStation && stationMatchesKitchen(orderAssignedStation) && stationMatchesKitchen(display.name)) return true

      return false
    }

    const nowMs = Date.now()
    const displayStatusRows: DisplayStatusRow[] = displays.map((display) => {
      const stationOrders = kdsOrders.filter((order) => matchesStation(display, order.assigned_station))

      const pendingOrders = stationOrders.filter((o) => o.status === 'pending').length
      const preparingOrders = stationOrders.filter((o) => o.status === 'preparing').length
      const readyOrders = stationOrders.filter((o) => o.status === 'ready').length

      const urgentOrders = stationOrders.filter((o) => o.priority === 'urgent').length

      let oldestOrderMinutes: number | null = null
      let oldestOrderMs = Number.POSITIVE_INFINITY
      for (const o of stationOrders) {
        const createdMs = new Date(o.created_at).getTime()
        if (Number.isFinite(createdMs) && createdMs < oldestOrderMs) oldestOrderMs = createdMs
      }
      if (stationOrders.length > 0 && Number.isFinite(oldestOrderMs)) {
        oldestOrderMinutes = Math.max(0, Math.floor((nowMs - oldestOrderMs) / 60000))
      }

      let lastActivityMs = Number.NEGATIVE_INFINITY
      for (const o of stationOrders) {
        for (const iso of [o.created_at, o.started_at, o.completed_at]) {
          if (!iso) continue
          const ms = new Date(iso).getTime()
          if (Number.isFinite(ms) && ms > lastActivityMs) lastActivityMs = ms
        }
      }
      const lastActivityIso = Number.isFinite(lastActivityMs) ? new Date(lastActivityMs).toISOString() : null

      const openOrders = stationOrders.length

      return {
        stationName: display.name,
        openHref: display.token ? `/kds?token=${display.token}` : null,
        isActive: openOrders > 0,
        openOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        urgentOrders,
        oldestOrderMinutes,
        lastActivityIso,
      }
    })

    const totalDisplayOpenOrders = displayStatusRows.reduce((sum, row) => sum + row.openOrders, 0)
    const totalDisplayReadyOrders = displayStatusRows.reduce((sum, row) => sum + row.readyOrders, 0)
    const totalDisplayUrgentOrders = displayStatusRows.reduce((sum, row) => sum + row.urgentOrders, 0)

    setState((prev) => ({
      ...prev,
      displayStatusRows,
      totalDisplayOpenOrders,
      totalDisplayReadyOrders,
      totalDisplayUrgentOrders,
    }))
  }, [])

  const formatPercent = useCallback((value: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value)
  }, [])

  const getDelta = useCallback((current: number, previous: number) => {
    if (previous <= 0) return current > 0 ? 1 : 0
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
      const badgeClass = isUp
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-rose-200 bg-rose-50 text-rose-700'

      return (
        <Card className="@container/card bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
          <CardHeader className="relative">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{value}</CardTitle>
            {badgeText ? (
              <div className="absolute right-4 top-4">
                <Badge variant="outline" className={`flex gap-1 rounded-lg text-xs ${badgeClass}`}>
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
        .select('role')
        .eq('id', user.id)
        .single()
      if (userError) throw userError
      if (!userData) return

      setUserRole((userData.role as UserRole) ?? null)
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

      const canSeeReservations = userData.role === 'owner' || userData.role === 'manager'
      const nowIso = new Date().toISOString()
      const next24Iso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const [salesRes, stockRes, salesItemsRes, prevMonthSalesRes, upcomingReservationsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('sale_date,total_amount')
          .neq('payment_status', 'refunded')
          .gte('sale_date', start30Iso)
          .order('sale_date', { ascending: true }),
        supabase
          .from('stock')
          .select('ingredient_id, quantity, ingredients (name, unit, cost_per_unit, reorder_level)'),
        supabase
          .from('sales')
          .select('sale_items (quantity, total_price, menu_items (name))')
          .neq('payment_status', 'refunded')
          .gte('sale_date', start30Iso)
          .order('sale_date', { ascending: false })
          .limit(250),
        supabase
          .from('sales')
          .select('sale_date,total_amount')
          .neq('payment_status', 'refunded')
          .gte('sale_date', prevMonthStartIso)
          .lte('sale_date', prevMonthEndIso),
        canSeeReservations
          ? supabase
              .from('reservations')
              .select('id, customer_name, reservation_time, party_size, status, tables(table_number)')
              .gte('reservation_time', nowIso)
              .lt('reservation_time', next24Iso)
              .order('reservation_time', { ascending: true })
              .limit(8)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (salesRes.error) throw salesRes.error
      if (stockRes.error) throw stockRes.error
      if (salesItemsRes.error) throw salesItemsRes.error
      if (prevMonthSalesRes.error) throw prevMonthSalesRes.error
      if (upcomingReservationsRes.error) throw upcomingReservationsRes.error

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
          totalStockValue += Math.max(0, qty) * cost
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

      const upcomingReservations =
        (((upcomingReservationsRes.data ?? []) as unknown) as {
          id: string
          customer_name: string
          reservation_time: string
          party_size: number
          status: string
          tables: { table_number: string }[] | { table_number: string } | null
        }[]).map((r) => {
          const tableValue = Array.isArray(r.tables) ? r.tables[0] : r.tables
          return {
            id: r.id,
            customerName: r.customer_name,
            reservationTime: r.reservation_time,
            partySize: Number(r.party_size) || 0,
            status: r.status,
            tableNumber: tableValue?.table_number ?? null,
          }
        }) ?? []

      void loadDisplayStatus()

      setState((prev) => ({
        ...prev,
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
        upcomingReservations,
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [loadDisplayStatus])

  useEffect(() => {
    const initialTimeoutId = window.setTimeout(() => {
      void loadDisplayStatus()
    }, 0)

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void loadDisplayStatus()
    }, 5000)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadDisplayStatus()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearTimeout(initialTimeoutId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [loadDisplayStatus])

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

      <DisplayStatusCard
        rows={state.displayStatusRows}
        totalOpenOrders={state.totalDisplayOpenOrders}
        totalReadyOrders={state.totalDisplayReadyOrders}
        totalUrgentOrders={state.totalDisplayUrgentOrders}
      />

      {(userRole === 'owner' || userRole === 'manager') && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Reservation Calendar</CardTitle>
                <CardDescription>View reservations by day, week, or month</CardDescription>
              </div>
              <Link
                href="/dashboard/reservations/calendar"
                className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Open Calendar
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {state.upcomingReservations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No reservations in the next 24 hours</div>
            ) : (
              <div className="space-y-2">
                {state.upcomingReservations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <Link href={`/dashboard/reservations/${r.id}`} className="truncate font-medium hover:underline">
                        {r.customerName}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.reservationTime).toLocaleString()}
                        {r.tableNumber ? ` · Table ${r.tableNumber}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {r.partySize} · {r.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
