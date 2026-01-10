'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'menu' | 'ingredients'>('pnl')
  const [loading, setLoading] = useState(true)
  const [pnlData, setPnlData] = useState<any>(null)
  const [menuPerformance, setMenuPerformance] = useState<any[]>([])
  const [ingredientTrends, setIngredientTrends] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadReports()
  }, [dateRange, activeTab])

  const loadReports = async () => {
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
      setPnlData(data?.[0])
    } else if (activeTab === 'menu') {
      const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
      const { data } = await supabase.rpc('get_menu_performance', {
        p_tenant_id: userData.tenant_id,
        p_days: days || 7,
      })
      setMenuPerformance(data || [])
    } else if (activeTab === 'ingredients') {
      const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
      const { data } = await supabase.rpc('get_ingredient_cost_trends', {
        p_tenant_id: userData.tenant_id,
        p_days: days || 30,
      })
      setIngredientTrends(data || [])
    }

    setLoading(false)
  }

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
          {[
            { id: 'pnl', label: 'Profit & Loss' },
            { id: 'menu', label: 'Menu Performance' },
            { id: 'ingredients', label: 'Ingredient Trends' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
                ${pnlData?.revenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Cost of Goods Sold</p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                ${pnlData?.cost_of_goods_sold?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Operating Expenses</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                ${pnlData?.operating_expenses?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-3xl font-bold mt-2 ${
                (pnlData?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${pnlData?.net_profit?.toFixed(2) || '0.00'}
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
                  ${pnlData?.gross_profit?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Net Profit:</span>
                <span className={
                  (pnlData?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }>
                  ${pnlData?.net_profit?.toFixed(2) || '0.00'}
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
                  <td className="p-4 text-right">${item.total_revenue.toFixed(2)}</td>
                  <td className="p-4 text-right">${item.total_cost.toFixed(2)}</td>
                  <td className={`p-4 text-right font-bold ${
                    item.total_margin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${item.total_margin.toFixed(2)}
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
                  <td className="p-4 text-right">${item.avg_cost_per_unit.toFixed(2)}</td>
                  <td className="p-4 text-right">${item.last_cost_per_unit.toFixed(2)}</td>
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
