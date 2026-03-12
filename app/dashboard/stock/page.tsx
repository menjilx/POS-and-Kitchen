'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import type { Location, StockAdjustmentType } from '@/types/database'
import { DataTable } from '@/components/data-table'
import { getColumns, StockWithIngredient } from './columns'

type StockHistoryRow = {
  id: string
  created_at: string
  adjustment_type: StockAdjustmentType
  quantity: number
  notes: string | null
  ingredient_id: string
  location_id: string
  ingredients: { name: string; unit: string } | { name: string; unit: string }[] | null
  locations: { name: string } | { name: string }[] | null
}

export default function StockPage() {
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stock, setStock] = useState<StockWithIngredient[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const defaultToDate = useMemo(() => new Date().toISOString().split('T')[0], [])
  const defaultFromDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }, [])

  const [historyFromDate, setHistoryFromDate] = useState(defaultFromDate)
  const [historyToDate, setHistoryToDate] = useState(defaultToDate)
  const [historyLocationId, setHistoryLocationId] = useState<string>('all')
  const [historyType, setHistoryType] = useState<'all' | StockAdjustmentType>('all')
  const [history, setHistory] = useState<StockHistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [adjustmentForm, setAdjustmentForm] = useState({
    ingredient_id: '',
    location_id: '',
    adjustment_type: 'adjustment' as StockAdjustmentType,
    quantity: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [stockRes, locationsRes, simpleMenuItemsRes] = await Promise.all([
      supabase
        .from('stock')
        .select(`
          *,
          ingredients (name, unit, reorder_level, ingredient_categories (name))
        `)
        .order('quantity', { ascending: true }),
      supabase
        .from('locations')
        .select('*')
        .order('name'),
      supabase
        .from('menu_items')
        .select('id, name, stock_ingredient_id')
        .eq('item_type', 'simple')
    ])

    const simpleMenuItems = (simpleMenuItemsRes.data ?? []) as Array<{ id: string; name: string; stock_ingredient_id: string | null }>
    const simpleItemsMap = new Map<string, string>()
    if (simpleMenuItems.length > 0) {
      const nameByMenuItemId = new Map<string, string>()
      simpleMenuItems.forEach((i) => nameByMenuItemId.set(i.id, i.name))

      simpleMenuItems.forEach((item) => {
        if (item.stock_ingredient_id && !simpleItemsMap.has(item.stock_ingredient_id)) {
          simpleItemsMap.set(item.stock_ingredient_id, item.name)
        }
      })

      const missingStockLinks = simpleMenuItems.filter((i) => !i.stock_ingredient_id)
      if (missingStockLinks.length > 0) {
        const { data: recipeItemsData } = await supabase
          .from('recipe_items')
          .select('menu_item_id, ingredient_id')
          .in('menu_item_id', missingStockLinks.map((i) => i.id))

        ;(recipeItemsData ?? []).forEach((row: { menu_item_id: string; ingredient_id: string }) => {
          const simpleName = nameByMenuItemId.get(row.menu_item_id)
          if (simpleName && !simpleItemsMap.has(row.ingredient_id)) {
            simpleItemsMap.set(row.ingredient_id, simpleName)
          }
        })
      }
    }

    const enrichedStock = (stockRes.data || []).map((s: StockWithIngredient) => ({
      ...s,
      simple_item_name: simpleItemsMap.get(s.ingredient_id)
    })) as StockWithIngredient[]

    setStock(enrichedStock)
    setLocations(locationsRes.data || [])
  }

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fromIso = new Date(`${historyFromDate}T00:00:00`).toISOString()
      const toIso = new Date(`${historyToDate}T23:59:59.999`).toISOString()

      let query = supabase
        .from('stock_adjustments')
        .select('id, created_at, adjustment_type, quantity, notes, ingredient_id, location_id, ingredients(name, unit), locations(name)')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false })
        .limit(250)

      if (historyLocationId !== 'all') {
        query = query.eq('location_id', historyLocationId)
      }
      if (historyType !== 'all') {
        query = query.eq('adjustment_type', historyType)
      }

      const { data, error: historyError } = await query
      if (historyError) throw historyError

      setHistory(((data ?? []) as unknown) as StockHistoryRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }, [historyFromDate, historyToDate, historyLocationId, historyType])

  useEffect(() => {
    if (!showHistory) return
    void loadHistory()
  }, [showHistory, loadHistory])

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!adjustmentForm.ingredient_id || !adjustmentForm.location_id) {
        throw new Error('Please select a stock item and location')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const quantity = parseFloat(adjustmentForm.quantity)
      const isPositive = adjustmentForm.adjustment_type === 'adjustment' && quantity >= 0

      const { error: adjError } = await supabase
        .from('stock_adjustments')
        .insert({
          ingredient_id: adjustmentForm.ingredient_id,
          location_id: adjustmentForm.location_id,
          adjustment_type: adjustmentForm.adjustment_type,
          quantity: isPositive ? Math.abs(quantity) : -Math.abs(quantity),
          notes: adjustmentForm.notes,
          created_by: user.id,
        })

      if (adjError) throw adjError

      const currentStock = stock.find(s => 
        s.ingredient_id === adjustmentForm.ingredient_id && 
        s.location_id === adjustmentForm.location_id
      )

      const newQuantity = currentStock
        ? Number(currentStock.quantity) + (isPositive ? Math.abs(quantity) : -Math.abs(quantity))
        : Math.abs(quantity)

      if (currentStock) {
        await supabase
          .from('stock')
          .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
          .eq('id', currentStock.id)
      } else {
        await supabase
          .from('stock')
          .insert({
            ingredient_id: adjustmentForm.ingredient_id,
            location_id: adjustmentForm.location_id,
            quantity: newQuantity,
          })
      }

      setShowAdjustmentModal(false)
      setAdjustmentForm({
        ingredient_id: '',
        location_id: '',
        adjustment_type: 'adjustment',
        quantity: '',
        notes: '',
      })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record adjustment')
    } finally {
      setLoading(false)
    }
  }

  const openAdjustmentModal = (stockItem: StockWithIngredient) => {
    setAdjustmentForm({
      ingredient_id: stockItem.ingredient_id,
      location_id: stockItem.location_id,
      adjustment_type: 'adjustment',
      quantity: '',
      notes: '',
    })
    setShowAdjustmentModal(true)
  }

  const columns = useMemo(() => getColumns(locations, openAdjustmentModal), [locations])
  const historyColumns = useMemo<ColumnDef<StockHistoryRow>[]>(() => {
    return [
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'ingredients.name',
        header: 'Item',
        cell: ({ row }) => {
          const ingredient = Array.isArray(row.original.ingredients)
            ? row.original.ingredients[0]
            : row.original.ingredients
          const location = Array.isArray(row.original.locations)
            ? row.original.locations[0]
            : row.original.locations
          return (
            <div className="flex flex-col">
              <span className="font-medium">{ingredient?.name ?? '-'}</span>
              <span className="text-xs text-muted-foreground">
                {location?.name ?? '-'}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'adjustment_type',
        header: 'Type',
        cell: ({ row }) => <span className="text-sm capitalize">{row.original.adjustment_type.replace('_', ' ')}</span>,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => {
          const ingredient = Array.isArray(row.original.ingredients)
            ? row.original.ingredients[0]
            : row.original.ingredients
          const unit = ingredient?.unit ? ` ${ingredient.unit}` : ''
          const qty = Number(row.original.quantity)
          return <span className={`text-sm font-medium ${qty < 0 ? 'text-red-600' : 'text-green-600'}`}>{qty}{unit}</span>
        },
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.notes ?? ''}</span>,
      },
    ]
  }, [])

  const getRowClassName = (row: StockWithIngredient) => {
    const isLow = Number(row.quantity) < Number(row.ingredients?.reorder_level)
    return isLow ? 'bg-red-50 hover:bg-red-100/50' : ''
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Levels</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="px-4 py-2 border rounded-md hover:bg-accent"
          >
            {showHistory ? 'Hide History' : 'History'}
          </button>
          <Link
            href="/dashboard/stock/stocktake"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Stocktake
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={stock} 
        getRowClassName={getRowClassName}
      />

      {showHistory && (
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold">History</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From</span>
                <input
                  type="date"
                  value={historyFromDate}
                  onChange={(e) => setHistoryFromDate(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To</span>
                <input
                  type="date"
                  value={historyToDate}
                  onChange={(e) => setHistoryToDate(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
              <select
                value={historyLocationId}
                onChange={(e) => setHistoryLocationId(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select
                value={historyType}
                onChange={(e) => setHistoryType(e.target.value as 'all' | StockAdjustmentType)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All types</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="waste">Waste</option>
                <option value="stocktake">Stocktake</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
          </div>

          <DataTable columns={historyColumns} data={history} />

          {historyLoading && (
            <div className="text-sm text-muted-foreground">Loading history…</div>
          )}
        </div>
      )}

      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Stock Adjustment</h2>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="rotate-45" />
              </button>
            </div>

            {error && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={adjustmentForm.adjustment_type}
              onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value as StockAdjustmentType })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
                  <option value="adjustment">Adjustment</option>
                  <option value="waste">Waste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantity ({adjustmentForm.adjustment_type === 'waste' ? '(positive for waste)' : '(+/- for adjust)'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentForm.quantity}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={adjustmentForm.adjustment_type === 'waste' ? 'Waste amount' : '+ to add, - to remove'}
                  required
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Reason for adjustment..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 py-2 px-4 border rounded-md hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
