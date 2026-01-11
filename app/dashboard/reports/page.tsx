'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'
import { useTenantSettings } from '@/hooks/use-tenant-settings'

type ProfitLossRow = {
  revenue: number | null
  cost_of_goods_sold: number | null
  operating_expenses: number | null
  net_profit: number | null
  gross_profit: number | null
}

type MenuPerformanceRow = {
  menu_item_id: string
  menu_item_name: string
  quantity_sold: number
  total_revenue: number
  total_cost: number
  total_margin: number
  margin_percentage: number
}

type IngredientTrendRow = {
  ingredient_id: string
  ingredient_name: string
  unit: string
  avg_cost_per_unit: number
  last_cost_per_unit: number
  total_purchased: number
  cost_change_percentage: number
}

type DateRange = {
  start: string
  end: string
}

const tabs = [
  { id: 'pnl', label: 'Profit & Loss' },
  { id: 'menu', label: 'Menu Performance' },
  { id: 'ingredients', label: 'Ingredient Trends' },
] as const

const defaultDateRange: DateRange = (() => {
  const end = new Date().toISOString().split('T')[0]
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return { start, end }
})()

export default function ReportsPage() {
  const { formatCurrency } = useTenantSettings()
  const [activeTab, setActiveTab] = useState<'pnl' | 'menu' | 'ingredients'>('pnl')
  const [loading, setLoading] = useState(true)
  const [pnlData, setPnlData] = useState<ProfitLossRow | null>(null)
  const [menuPerformance, setMenuPerformance] = useState<MenuPerformanceRow[]>([])
  const [ingredientTrends, setIngredientTrends] = useState<IngredientTrendRow[]>([])
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)

  const loadReports = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) return

    if (activeTab === 'pnl') {
      const { data } = await supabase.rpc('get_profit_loss', {
        p_tenant_id: userData.tenant_id,
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
      })
      const rows = (data ?? []) as unknown as ProfitLossRow[]
      setPnlData(rows[0] ?? null)
    } else if (activeTab === 'menu') {
      const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
      const { data } = await supabase.rpc('get_menu_performance', {
        p_tenant_id: userData.tenant_id,
        p_days: days || 7,
      })
      setMenuPerformance(((data ?? []) as unknown) as MenuPerformanceRow[])
    } else if (activeTab === 'ingredients') {
      const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
      const { data } = await supabase.rpc('get_ingredient_cost_trends', {
        p_tenant_id: userData.tenant_id,
        p_days: days || 30,
      })
      setIngredientTrends(((data ?? []) as unknown) as IngredientTrendRow[])
    }

    setLoading(false)
  }, [activeTab, dateRange.end, dateRange.start])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReports()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadReports])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-muted-foreground" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === 'pnl' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {formatCurrency(Number(pnlData?.revenue ?? 0))}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Cost of Goods Sold</p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                {formatCurrency(Number(pnlData?.cost_of_goods_sold ?? 0))}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Operating Expenses</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                {formatCurrency(Number(pnlData?.operating_expenses ?? 0))}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-3xl font-bold mt-2 ${
                (pnlData?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(Number(pnlData?.net_profit ?? 0))}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Profit & Loss Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Period:</span>
                <span className="font-medium">
                  {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="text-muted-foreground">Gross Profit:</span>
                <span className={`font-bold ${
                  (pnlData?.gross_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Number(pnlData?.gross_profit ?? 0))}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Net Profit:</span>
                <span className={
                  (pnlData?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }>
                  {formatCurrency(Number(pnlData?.net_profit ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'menu' ? (
        <div className="bg-card rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Menu Item</th>
                <th className="text-right p-4">Quantity Sold</th>
                <th className="text-right p-4">Revenue</th>
                <th className="text-right p-4">Total Cost</th>
                <th className="text-right p-4">Total Margin</th>
                <th className="text-right p-4">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {menuPerformance.map((item) => (
                <tr key={item.menu_item_id} className="border-b hover:bg-accent">
                  <td className="p-4 font-medium">{item.menu_item_name}</td>
                  <td className="p-4 text-right">{item.quantity_sold}</td>
                  <td className="p-4 text-right">{formatCurrency(item.total_revenue)}</td>
                  <td className="p-4 text-right">{formatCurrency(item.total_cost)}</td>
                  <td className={`p-4 text-right font-bold ${
                    item.total_margin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(item.total_margin)}
                  </td>
                  <td className={`p-4 text-right ${
                    item.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.margin_percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Ingredient</th>
                <th className="text-left p-4">Unit</th>
                <th className="text-right p-4">Avg Cost/Unit</th>
                <th className="text-right p-4">Last Cost</th>
                <th className="text-right p-4">Total Purchased</th>
                <th className="text-right p-4">Cost Change</th>
              </tr>
            </thead>
            <tbody>
              {ingredientTrends.map((item) => (
                <tr key={item.ingredient_id} className="border-b hover:bg-accent">
                  <td className="p-4 font-medium">{item.ingredient_name}</td>
                  <td className="p-4 text-sm">{item.unit}</td>
                  <td className="p-4 text-right">{formatCurrency(item.avg_cost_per_unit)}</td>
                  <td className="p-4 text-right">{formatCurrency(item.last_cost_per_unit)}</td>
                  <td className="p-4 text-right">{item.total_purchased.toFixed(2)}</td>
                  <td className={`p-4 text-right font-bold ${
                    item.cost_change_percentage > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.cost_change_percentage > 0 ? '+' : ''}{item.cost_change_percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
