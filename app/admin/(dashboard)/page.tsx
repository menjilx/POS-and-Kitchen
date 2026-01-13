'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase/client'
import { Users, Building2, AlertTriangle, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Tenant {
  id: string
  name: string
  email: string
  user_count: number
  total_sales: number
  is_suspended: boolean
  created_at: string
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  className?: string
}

function StatCard({ title, value, subtitle, icon: Icon, className }: StatCardProps) {
  return (
    <Link href="#" className="block h-full">
      <Card className={cn('h-full transition-shadow hover:shadow-md', className)}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
            {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
          </div>
          <Icon className="h-10 w-10 text-muted-foreground" />
        </CardHeader>
      </Card>
    </Link>
  )
}

type TenantRegistrationPoint = {
  date: string
  registrations: number
}

const tenantRegistrationsConfig = {
  registrations: {
    label: 'Registrations',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

function isoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildDailyTenantRegistrations(tenants: Tenant[], days: number): TenantRegistrationPoint[] {
  const end = new Date()
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))

  const countsByDate = new Map<string, number>()
  tenants.forEach((t) => {
    const d = new Date(t.created_at)
    if (Number.isNaN(d.valueOf())) return
    const key = isoDateUTC(d)
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1)
  })

  const points: TenantRegistrationPoint[] = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))

  while (cursor <= endUtc) {
    const key = isoDateUTC(cursor)
    points.push({ date: key, registrations: countsByDate.get(key) ?? 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return points
}

export default function AdminDashboardPage() {
  const isMobile = useIsMobile()
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalSalesDisplay: '0',
    suspendedTenants: 0,
  })
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month')

  useEffect(() => {
    if (isMobile) setTimeRange('week')
  }, [isMobile])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [tenantsData, usersData, settingsData] = await Promise.all([
        supabase.rpc('get_all_tenants'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.rpc('get_all_settings'),
      ])

      if (tenantsData.error) throw tenantsData.error
      if (usersData.error) throw usersData.error

      const currency =
        (settingsData.data as Record<string, { value?: string }> | null)?.currency?.value ?? 'USD'

      const tenants = (tenantsData.data || []) as Tenant[]
      const suspendedCount = tenants.filter((t) => t.is_suspended).length

      const totalSales = tenants.reduce((sum, t) => sum + (Number(t.total_sales) || 0), 0)
      const totalSalesDisplay = formatCurrency(totalSales, currency)

      setStats({
        totalTenants: tenants.length,
        totalUsers: usersData.count || 0,
        totalSalesDisplay: totalSalesDisplay || '0',
        suspendedTenants: suspendedCount,
      })

      setTenants(tenants)
    } catch (err) {
      console.error('Failed to load stats details:', err instanceof Error ? err.message : err)
    } finally {
      setLoading(false)
    }
  }

  const registrationDays = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30

  const tenantRegistrationsData = useMemo(() => {
    return buildDailyTenantRegistrations(tenants, registrationDays)
  }, [tenants, registrationDays])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide overview and management</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tenants"
              value={stats.totalTenants}
              subtitle={`${stats.suspendedTenants} suspended`}
              icon={Building2}
              className="bg-blue-50/60"
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              className="bg-green-50/60"
            />
            <StatCard
              title="Total Sales"
              value={stats.totalSalesDisplay}
              subtitle="All time"
              icon={DollarSign}
              className="bg-purple-50/60"
            />
            <StatCard
              title="Suspended"
              value={stats.suspendedTenants}
              subtitle="Tenants"
              icon={AlertTriangle}
              className="bg-red-50/60"
            />
          </div>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardTitle>Tenant Registrations</CardTitle>
              <CardDescription>New tenants created per day</CardDescription>

              <div className="absolute right-4 top-4">
                <ToggleGroup
                  type="single"
                  value={timeRange}
                  onValueChange={(v) => (v ? setTimeRange(v as typeof timeRange) : null)}
                  variant="outline"
                  className="@[767px]/card:flex hidden"
                >
                  <ToggleGroupItem value="day" className="h-8 px-2.5">
                    Day
                  </ToggleGroupItem>
                  <ToggleGroupItem value="week" className="h-8 px-2.5">
                    Week
                  </ToggleGroupItem>
                  <ToggleGroupItem value="month" className="h-8 px-2.5">
                    Month
                  </ToggleGroupItem>
                </ToggleGroup>

                <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
                  <SelectTrigger className="@[767px]/card:hidden flex w-32" aria-label="Select range">
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="day" className="rounded-lg">
                      Day
                    </SelectItem>
                    <SelectItem value="week" className="rounded-lg">
                      Week
                    </SelectItem>
                    <SelectItem value="month" className="rounded-lg">
                      Month
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer config={tenantRegistrationsConfig} className="aspect-auto h-64 w-full">
                <AreaChart data={tenantRegistrationsData} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="fillRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-registrations)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="var(--color-registrations)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="registrations"
                    type="monotone"
                    fill="url(#fillRegistrations)"
                    stroke="var(--color-registrations)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/admin/tenants/new"
                  className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Add New Tenant</p>
                    <p className="text-sm text-muted-foreground">Create a new restaurant account</p>
                  </div>
                </Link>
                <Link
                  href="/admin/users/new"
                  className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="rounded-lg bg-green-100 p-2">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Add Super Admin</p>
                    <p className="text-sm text-muted-foreground">Promote a user to superadmin</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <span className="font-medium">Database</span>
                  <span className="font-medium text-green-700">Connected</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <span className="font-medium">Authentication</span>
                  <span className="font-medium text-green-700">Active</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <span className="font-medium">SuperAdmin Role</span>
                  <span className="font-medium text-blue-700">Enabled</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
