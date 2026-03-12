'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'
import type { Location } from '@/types/database'
import { DataTable } from '@/components/data-table'
import { getColumns, StockItem } from './columns'

export default function StocktakePage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    location_id: '',
    notes: '',
  })
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [stocktakeCreated, setStocktakeCreated] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('locations')
      .select('*')
      .order('name')

    setLocations(data || [])
  }

  const loadStockItems = useCallback(async () => {
    if (!formData.location_id) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch all active ingredients
    const { data: ingredients } = await supabase
      .from('ingredients')
      .select('*')
      .eq('status', 'active')
      .order('name')

    // Fetch current stock for this location
    const { data: currentStock } = await supabase
      .from('stock')
      .select('*')
      .eq('location_id', formData.location_id)

    if (ingredients) {
      const items: StockItem[] = ingredients.map((ing) => {
        const stockEntry = currentStock?.find((s) => s.ingredient_id === ing.id)
        const quantity = stockEntry ? Number(stockEntry.quantity) : 0

        return {
          id: ing.id,
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          unit: ing.unit,
          expected_quantity: quantity,
          actual_quantity: quantity,
          variance: 0,
          variance_percentage: 0,
        }
      })

      setStockItems(items)
    }
  }, [formData.location_id])

  useEffect(() => {
    loadStockItems()
  }, [loadStockItems])

  const updateActualQuantity = useCallback((id: string, value: number) => {
    setStockItems(prev => prev.map(item => {
      if (item.id === id) {
        const variance = value - item.expected_quantity
        const variance_percentage = item.expected_quantity > 0
          ? ((value - item.expected_quantity) / item.expected_quantity) * 100
          : 0
        return { ...item, actual_quantity: value, variance, variance_percentage }
      }
      return item
    }))
  }, [])

  const columns = useMemo(() => getColumns(updateActualQuantity), [updateActualQuantity])
  const filteredStockItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return stockItems
    return stockItems.filter((item) => item.ingredient_name.toLowerCase().includes(term))
  }, [searchTerm, stockItems])

  const calculateVariance = () => {
    const positiveVariance = stockItems.reduce((sum, item) => {
      return item.variance > 0 ? sum + item.variance : sum
    }, 0)
    const negativeVariance = stockItems.reduce((sum, item) => {
      return item.variance < 0 ? sum + Math.abs(item.variance) : sum
    }, 0)
    return { positiveVariance, negativeVariance }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.location_id) {
      setError('Please select a location')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: stocktake } = await supabase
        .from('stocktakes')
        .insert({
          location_id: formData.location_id,
          date: new Date().toISOString(),
          performed_by: user.id,
          notes: formData.notes,
        })
        .select()
        .single()

      if (!stocktake) throw new Error('Failed to create stocktake')

      const stocktakeItems = stockItems.map(item => ({
        stocktake_id: stocktake.id,
        ingredient_id: item.id,
        expected_quantity: item.expected_quantity,
        actual_quantity: item.actual_quantity,
      }))

      const { error: itemsError } = await supabase
        .from('stocktake_items')
        .insert(stocktakeItems)

      if (itemsError) throw itemsError

      // Update actual stock levels
      const stockUpdates = stockItems.map(item => ({
        location_id: formData.location_id,
        ingredient_id: item.id,
        quantity: item.actual_quantity,
        last_updated: new Date().toISOString()
      }))

      const { error: stockUpdateError } = await supabase
        .from('stock')
        .upsert(stockUpdates, { onConflict: 'ingredient_id, location_id' })

      if (stockUpdateError) throw stockUpdateError

      setStocktakeCreated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stocktake')
    } finally {
      setLoading(false)
    }
  }

  const variance = calculateVariance()

  if (stocktakeCreated) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Stocktake Complete</h1>
            <p className="text-muted-foreground">
              Your stocktake has been recorded successfully
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Variance Summary</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Surplus</p>
              <p className="text-3xl font-bold text-green-600">
                +{variance.positiveVariance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shortage</p>
              <p className="text-3xl font-bold text-red-600">
                -{variance.negativeVariance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard/stock')}
            className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Stock
          </button>
          <button
            onClick={() => {
              setStocktakeCreated(false)
              setStockItems(stockItems.map(item => ({
                ...item,
                actual_quantity: item.expected_quantity,
                variance: 0,
                variance_percentage: 0,
              })))
            }}
            className="flex-1 py-2 px-4 border rounded-md hover:bg-accent"
          >
            Start New Stock
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stock" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Stock</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2">
              Location
            </label>
            <select
              id="location"
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes
            </label>
            <input
              id="notes"
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Optional notes..."
            />
          </div>
        </div>
      </div>

      {stockItems.length > 0 && (
        <>
          <div className="bg-card rounded-lg border p-4">
            <label htmlFor="stock-search" className="block text-sm font-medium mb-2">
              Search products
            </label>
            <input
              id="stock-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type product name..."
            />
          </div>

          <DataTable columns={columns} data={filteredStockItems} />

          <div className="bg-card rounded-lg border p-6 sticky bottom-6">
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Surplus</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{variance.positiveVariance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Shortage</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{variance.negativeVariance.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-lg"
              >
                {loading ? 'Saving...' : 'Complete Stocktake'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
