'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

export default function NewPurchasePage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [purchaseItems, setPurchaseItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

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
      const [ingredientsRes, suppliersRes, locationsRes] = await Promise.all([
        supabase
          .from('ingredients')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('suppliers')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .order('name'),
        supabase
          .from('locations')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .order('name'),
      ])

      setIngredients(ingredientsRes.data || [])
      setSuppliers(suppliersRes.data || [])
      setLocations(locationsRes.data || [])
    }
  }

  const addPurchaseItem = () => {
    if (ingredients.length === 0 || locations.length === 0) return
    setPurchaseItems([
      ...purchaseItems,
      {
        ingredient_id: ingredients[0].id,
        ingredient_name: ingredients[0].name,
        unit: ingredients[0].unit,
        current_cost: Number(ingredients[0].cost_per_unit),
        quantity: 1,
        unit_price: Number(ingredients[0].cost_per_unit),
        location_id: locations[0].id,
      },
    ])
  }

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems]
    if (field === 'ingredient_id') {
      const ingredient = ingredients.find(i => i.id === value)
      updated[index] = {
        ...updated[index],
        [field]: value,
        ingredient_name: ingredient?.name || '',
        unit: ingredient?.unit || '',
        current_cost: Number(ingredient?.cost_per_unit) || 0,
      }
    } else if (field === 'quantity' || field === 'unit_price') {
      updated[index] = { ...updated[index], [field]: Number(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setPurchaseItems(updated)
  }

  const calculateTotals = () => {
    const total = purchaseItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price)
    }, 0)
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (purchaseItems.length === 0) {
      setError('Please add at least one item')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const totalAmount = calculateTotals()

      const { data: purchase } = await supabase
        .from('purchases')
        .insert({
          tenant_id: userData.tenant_id,
          supplier_id: formData.supplier_id || null,
          invoice_number: formData.invoice_number || null,
          invoice_date: formData.invoice_date,
          total_amount: totalAmount,
          notes: formData.notes,
          created_by: user.id,
        })
        .select()
        .single()

      if (!purchase) throw new Error('Failed to create purchase')

      const purchaseItemInserts = purchaseItems.map(item => ({
        purchase_id: purchase.id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        location_id: item.location_id,
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItemInserts)

      if (itemsError) throw itemsError

      router.push('/dashboard/purchases')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/purchases" className="text-primary hover:underline">
          ← Back
        </a>
        <h1 className="text-3xl font-bold">New Purchase</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Purchase Details</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium mb-2">
                  Supplier
                </label>
                <select
                  id="supplier"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select supplier (optional)</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="invoice_number" className="block text-sm font-medium mb-2">
                  Invoice Number
                </label>
                <input
                  id="invoice_number"
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="INV-001"
                />
              </div>

              <div>
                <label htmlFor="invoice_date" className="block text-sm font-medium mb-2">
                  Invoice Date
                </label>
                <input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Any notes..."
                />
              </div>
            </form>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Items</h2>
              <button
                type="button"
                onClick={addPurchaseItem}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {purchaseItems.map((item, index) => (
                <div key={index} className="border p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ingredient</label>
                      <select
                        value={item.ingredient_id}
                        onChange={(e) => updatePurchaseItem(index, 'ingredient_id', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} (Current: ${Number(ing.cost_per_unit).toFixed(2)}/{ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <select
                        value={item.location_id}
                        onChange={(e) => updatePurchaseItem(index, 'location_id', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity ({item.unit})</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="w-full text-right py-2">
                        <div className="text-lg font-bold">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </div>
                        {item.unit_price !== item.current_cost && (
                          <div className="text-xs text-muted-foreground">
                            Previous: ${item.current_cost.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePurchaseItem(index)}
                        className="ml-2 p-2 text-destructive hover:bg-destructive/10 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {purchaseItems.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No items added yet. Click "Add Item" to start adding products.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total:</span>
                <span>${calculateTotals().toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || purchaseItems.length === 0}
              className="w-full mt-6 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
