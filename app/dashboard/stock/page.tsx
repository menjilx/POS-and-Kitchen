'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2, AlertCircle } from 'lucide-react'

export default function StockPage() {
  const router = useRouter()
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stock, setStock] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

  const [adjustmentForm, setAdjustmentForm] = useState({
    ingredient_id: '',
    location_id: '',
    adjustment_type: 'adjustment',
    quantity: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      const [stockRes, locationsRes] = await Promise.all([
        supabase
          .from('stock')
          .select(`
            *,
            ingredients (name, unit, reorder_level, ingredient_categories (name))
          `)
          .eq('tenant_id', userData.tenant_id)
          .order('quantity', { ascending: true }),
        supabase
          .from('locations')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .order('name'),
      ])

      setStock(stockRes.data || [])
      setLocations(locationsRes.data || [])
    }
  }

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const quantity = parseFloat(adjustmentForm.quantity)
      const isPositive = adjustmentForm.adjustment_type === 'adjustment' && quantity >= 0

      const { error: adjError } = await supabase
        .from('stock_adjustments')
        .insert({
          tenant_id: userData.tenant_id,
          ingredient_id: adjustmentForm.ingredient_id,
          location_id: adjustmentForm.location_id,
          adjustment_type: adjustmentForm.adjustment_type as any,
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
            tenant_id: userData.tenant_id,
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

  const openAdjustmentModal = (stockItem: any) => {
    setAdjustmentForm({
      ingredient_id: stockItem.ingredients.id,
      location_id: stockItem.location_id,
      adjustment_type: 'adjustment',
      quantity: '',
      notes: '',
    })
    setShowAdjustmentModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Monitoring</h1>
        <a
          href="/dashboard/stock/stocktake"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Stocktake
        </a>
      </div>

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Ingredient</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Location</th>
              <th className="text-left p-4">Quantity</th>
              <th className="text-left p-4">Reorder Level</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item: any) => {
              const isLow = Number(item.quantity) < Number(item.ingredients?.reorder_level)
              return (
                <tr
                  key={item.id}
                  className={`border-b hover:bg-accent ${
                    isLow ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="p-4">{item.ingredients?.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {item.ingredients?.ingredient_categories?.name || '-'}
                  </td>
                  <td className="p-4">
                    {locations.find(l => l.id === item.location_id)?.name || item.location_id}
                  </td>
                  <td className="p-4 font-medium">
                    {Number(item.quantity).toFixed(2)} {item.ingredients?.unit}
                  </td>
                  <td className="p-4">{item.ingredients?.reorder_level}</td>
                  <td className="p-4">
                    {isLow ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => openAdjustmentModal(item)}
                      className="text-primary hover:underline text-sm"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value })}
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
