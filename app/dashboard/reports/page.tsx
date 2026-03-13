'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'
import { useAppSettings } from '@/hooks/use-app-settings'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'

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

type StockItemTrendRow = {
  stock_item_id: string
  stock_item_name: string
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
  { id: 'ingredients', label: 'Stock Item Trends' },
] as const

const defaultDateRange: DateRange = (() => {
  const end = new Date().toISOString().split('T')[0]
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return { start, end }
})()

export default function ReportsPage() {
  const { formatCurrency } = useAppSettings()
  const [activeTab, setActiveTab] = useState<'pnl' | 'menu' | 'ingredients'>('pnl')
  const [loading, setLoading] = useState(true)
  const [pnlData, setPnlData] = useState<ProfitLossRow | null>(null)
  const [menuPerformance, setMenuPerformance] = useState<MenuPerformanceRow[]>([])
  const [ingredientTrends, setIngredientTrends] = useState<StockItemTrendRow[]>([])
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)

  const menuColumns = useMemo<ColumnDef<MenuPerformanceRow>[]>(() => [
    {
      accessorKey: "menu_item_name",
      header: "Menu Item",
      cell: ({ row }) => <span className="font-medium">{row.original.menu_item_name}</span>,
    },
    {
      accessorKey: "quantity_sold",
      header: "Quantity Sold",
      cell: ({ row }) => <span>{row.original.quantity_sold}</span>,
    },
    {
      accessorKey: "total_revenue",
      header: "Revenue",
      cell: ({ row }) => <span>{formatCurrency(row.original.total_revenue)}</span>,
    },
    {
      accessorKey: "total_cost",
      header: "Total Cost",
      cell: ({ row }) => <span>{formatCurrency(row.original.total_cost)}</span>,
    },
    {
      accessorKey: "total_margin",
      header: "Total Margin",
      cell: ({ row }) => (
        <span className={`font-bold ${
          row.original.total_margin >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(row.original.total_margin)}
        </span>
      ),
    },
    {
      accessorKey: "margin_percentage",
      header: "Margin %",
      cell: ({ row }) => (
        <span className={`${
          row.original.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.original.margin_percentage.toFixed(1)}%
        </span>
      ),
    },
  ], [formatCurrency])

  const ingredientColumns = useMemo<ColumnDef<StockItemTrendRow>[]>(() => [
    {
      accessorKey: "stock_item_name",
      header: "Stock Item",
      cell: ({ row }) => <span className="font-medium">{row.original.stock_item_name}</span>,
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => <span className="text-sm">{row.original.unit}</span>,
    },
    {
      accessorKey: "avg_cost_per_unit",
      header: "Avg Cost/Unit",
      cell: ({ row }) => <span>{formatCurrency(row.original.avg_cost_per_unit)}</span>,
    },
    {
      accessorKey: "last_cost_per_unit",
      header: "Last Cost",
      cell: ({ row }) => <span>{formatCurrency(row.original.last_cost_per_unit)}</span>,
    },
    {
      accessorKey: "total_purchased",
      header: "Total Purchased",
      cell: ({ row }) => <span>{row.original.total_purchased.toFixed(2)}</span>,
    },
    {
      accessorKey: "cost_change_percentage",
      header: "Cost Change",
      cell: ({ row }) => (
        <span className={`font-bold ${
          row.original.cost_change_percentage > 0 ? 'text-red-600' : 'text-green-600'
        }`}>
          {row.original.cost_change_percentage > 0 ? '+' : ''}{row.original.cost_change_percentage.toFixed(1)}%
        </span>
      ),
    },
  ], [formatCurrency])

  const loadReports = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (activeTab === 'pnl') {
      const { data } = await supabase.rpc('get_profit_loss', {
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
      })
      const rows = (data ?? []) as unknown as ProfitLossRow[]
      setPnlData(rows[0] ?? null)
    } else if (activeTab === 'menu') {
      const { data } = await supabase.rpc('get_menu_performance', {
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
      })
      setMenuPerformance(((data ?? []) as unknown) as MenuPerformanceRow[])
    } else if (activeTab === 'ingredients') {
      const { data } = await supabase.rpc('get_stock_item_cost_trends', {
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
      })
      setIngredientTrends(((data ?? []) as unknown) as StockItemTrendRow[])
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

  const getTabDescription = () => {
    switch (activeTab) {
      case 'pnl':
        return 'Overview of your financial performance including revenue, costs, and expenses. Calculated based on sales (revenue), menu item costs (COGS), and recorded expenses.'
      case 'menu':
        return 'Analysis of your menu items based on sales volume and profitability. Helps identify your best sellers and most profitable items.'
      case 'ingredients':
        return 'Track price fluctuations of your stock items based on purchase history. Compares current standard cost vs. weighted average cost from recent purchases.'
    }
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

      <div className="space-y-4">
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
        
        <div className="bg-muted/50 p-4 rounded-md border text-sm text-muted-foreground">
          <p>{getTabDescription()}</p>
        </div>
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
        menuPerformance.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card p-8 text-center">
            <p className="text-muted-foreground text-lg mb-2">No menu performance data found</p>
            <p className="text-sm text-muted-foreground">Try adjusting the date range or ensure you have recorded sales.</p>
          </div>
        ) : (
          <DataTable columns={menuColumns} data={menuPerformance} />
        )
      ) : (
        ingredientTrends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card p-8 text-center">
            <p className="text-muted-foreground text-lg mb-2">No stock item data found</p>
            <p className="text-sm text-muted-foreground">Add stock items and record purchases to see cost trends.</p>
          </div>
        ) : (
          <DataTable columns={ingredientColumns} data={ingredientTrends} />
        )
      )}
    </div>
  )
}
