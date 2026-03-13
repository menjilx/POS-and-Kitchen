'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2, Paperclip, X } from 'lucide-react'
import type { Ingredient, Location, Supplier } from '@/types/database'
import { useAppSettings } from '@/hooks/use-app-settings'
import { uploadFile } from '@/app/actions/storage'

type PurchaseItemDraft = {
  ingredient_id: string
  ingredient_name: string
  unit: string
  current_cost: number
  quantity: number
  unit_price: number
  location_id: string
}

type PurchaseFormData = {
  supplier_id: string
  invoice_number: string
  invoice_date: string
  notes: string
}

const defaultInvoiceDate = new Date().toISOString().split('T')[0]

export default function NewPurchasePage() {
  const router = useRouter()
  const { currencySymbol, formatCurrency } = useAppSettings()
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplier_id: '',
    invoice_number: '',
    invoice_date: defaultInvoiceDate,
    notes: '',
  })
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [simpleItems, setSimpleItems] = useState<{ id: string, name: string, ingredient_id: string }[]>([])
  const [showCreateStockItem, setShowCreateStockItem] = useState(false)
  const [createStockTargetIndex, setCreateStockTargetIndex] = useState<number | null>(null)
  const [creatingStockItem, setCreatingStockItem] = useState(false)
  const [newStockItem, setNewStockItem] = useState({
    name: '',
    unit: '',
    cost_per_unit: '',
    reorder_level: '',
  })

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [ingredientsRes, suppliersRes, locationsRes, simpleMenuItemsRes] = await Promise.all([
      supabase
        .from('ingredients')
        .select('*')
        .eq('status', 'active')
        .order('name'),
      supabase
        .from('suppliers')
        .select('*')
        .order('name'),
      supabase
        .from('locations')
        .select('*')
        .order('name'),
      supabase
        .from('menu_items')
        .select('id, name, stock_ingredient_id')
        .eq('item_type', 'simple')
        .order('name')
    ])

    setIngredients(((ingredientsRes.data ?? []) as unknown) as Ingredient[])
    setSuppliers(((suppliersRes.data ?? []) as unknown) as Supplier[])
    setLocations(((locationsRes.data ?? []) as unknown) as Location[])

    const simpleMenuItems = (simpleMenuItemsRes.data ?? []) as Array<{ id: string; name: string; stock_ingredient_id: string | null }>
    if (simpleMenuItems.length === 0) {
      setSimpleItems([])
      return
    }

    const missingStockLinks = simpleMenuItems.filter((i) => !i.stock_ingredient_id)
    const recipeByMenuItemId = new Map<string, string>()
    if (missingStockLinks.length > 0) {
      const { data: recipeItemsData } = await supabase
        .from('recipe_items')
        .select('menu_item_id, ingredient_id')
        .in('menu_item_id', missingStockLinks.map((i) => i.id))

      ;(recipeItemsData ?? []).forEach((row: { menu_item_id: string; ingredient_id: string }) => {
        if (!recipeByMenuItemId.has(row.menu_item_id)) {
          recipeByMenuItemId.set(row.menu_item_id, row.ingredient_id)
        }
      })
    }

    setSimpleItems(
      simpleMenuItems
        .map((item) => ({
          id: item.id,
          name: item.name,
          ingredient_id: item.stock_ingredient_id ?? recipeByMenuItemId.get(item.id) ?? '',
        }))
        .filter((item) => item.ingredient_id)
    )
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadData])

  const addPurchaseItem = () => {
    const firstIngredient = ingredients[0]
    const firstLocation = locations[0]
    if (!firstIngredient || !firstLocation) return

    setPurchaseItems([
      ...purchaseItems,
      {
        ingredient_id: firstIngredient.id,
        ingredient_name: firstIngredient.name,
        unit: firstIngredient.unit,
        current_cost: Number(firstIngredient.cost_per_unit),
        quantity: 1,
        unit_price: Number(firstIngredient.cost_per_unit),
        location_id: firstLocation.id,
      },
    ])
  }

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const updatePurchaseItem = (
    index: number,
    field: 'ingredient_id' | 'quantity' | 'unit_price' | 'location_id',
    value: string
  ) => {
    const updated = [...purchaseItems]
    if (field === 'ingredient_id') {
      if (value === '__create_stock_item__') {
        setCreateStockTargetIndex(index)
        setShowCreateStockItem(true)
        return
      }
      // Check if value is a simple item ID (prefixed with 'item_') or raw ingredient ID
      let ingredientId = value
      let displayName = ''
      
      if (value.startsWith('item_')) {
        const simpleItemId = value.replace('item_', '')
        const simpleItem = simpleItems.find(i => i.id === simpleItemId)
        if (simpleItem) {
          ingredientId = simpleItem.ingredient_id
          displayName = simpleItem.name
        }
      }

      const ingredient = ingredients.find((i) => i.id === ingredientId)
      
      updated[index] = {
        ...updated[index],
        ingredient_id: ingredientId,
        // If we found a simple item name, use it. Otherwise use ingredient name.
        ingredient_name: displayName || ingredient?.name || '',
        unit: ingredient?.unit || '',
        current_cost: Number(ingredient?.cost_per_unit) || 0,
        unit_price: Number(ingredient?.cost_per_unit) || 0,
        // We persist the selection value (e.g. 'item_123') in a temporary field if needed for UI state, 
        // but here we just update the core data. 
        // NOTE: The select element below needs to be controlled carefully.
      }
    } else if (field === 'quantity' || field === 'unit_price') {
      updated[index] = { ...updated[index], [field]: Number(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setPurchaseItems(updated)
  }

  const handleCreateStockItem = async () => {
    if (!newStockItem.name.trim() || !newStockItem.unit.trim()) {
      setError('Stock item name and unit are required')
      return
    }

    setCreatingStockItem(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: created, error: createError } = await supabase
        .from('ingredients')
        .insert({
          name: newStockItem.name.trim(),
          unit: newStockItem.unit.trim(),
          cost_per_unit: Number(newStockItem.cost_per_unit) || 0,
          reorder_level: Number(newStockItem.reorder_level) || 10,
          status: 'active',
        })
        .select('*')
        .single()

      if (createError) throw createError
      if (!created) throw new Error('Failed to create stock item')

      const createdIngredient = created as unknown as Ingredient
      setIngredients((prev) => [...prev, createdIngredient].sort((a, b) => a.name.localeCompare(b.name)))

      if (createStockTargetIndex !== null) {
        setPurchaseItems((prev) => {
          const next = [...prev]
          const firstLocation = locations[0]
          next[createStockTargetIndex] = {
            ...next[createStockTargetIndex],
            ingredient_id: createdIngredient.id,
            ingredient_name: createdIngredient.name,
            unit: createdIngredient.unit,
            current_cost: Number(createdIngredient.cost_per_unit) || 0,
            unit_price: Number(createdIngredient.cost_per_unit) || 0,
            location_id: next[createStockTargetIndex].location_id || firstLocation?.id || '',
          }
          return next
        })
      }

      setShowCreateStockItem(false)
      setCreateStockTargetIndex(null)
      setNewStockItem({
        name: '',
        unit: '',
        cost_per_unit: '',
        reorder_level: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stock item')
    } finally {
      setCreatingStockItem(false)
    }
  }

  const calculateTotals = () => {
    const total = purchaseItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price)
    }, 0)
    return total
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
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

      const totalAmount = calculateTotals()

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          supplier_id: formData.supplier_id || null,
          invoice_number: formData.invoice_number || null,
          invoice_date: formData.invoice_date,
          total_amount: totalAmount,
          notes: formData.notes,
          created_by: user.id,
        })
        .select()
        .single()

      if (purchaseError) throw new Error(purchaseError.message)
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

      if (itemsError) throw new Error(itemsError.message)

      // Upload files
      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          const result = await uploadFile(formData)
          if (!result.success || !result.url) {
            throw new Error(`Failed to upload file ${file.name}: ${result.error}`)
          }
          return {
            purchase_id: purchase.id,
            file_name: file.name,
            file_url: result.url,
            file_type: file.type,
            file_size: file.size,
          }
        })

        const attachments = await Promise.all(uploadPromises)

        const { error: attachmentsError } = await supabase
          .from('purchase_attachments')
          .insert(attachments)

        if (attachmentsError) throw new Error(attachmentsError.message)
      }

      router.push('/dashboard/purchases')
    } catch (err) {
      console.error('Purchase creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases" className="text-primary hover:underline">
          ← Back
        </Link>
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  Supporting Documents
                </label>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    <Paperclip size={16} />
                    <span>Attach Files</span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {files.length} file(s) selected
                  </span>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm truncate max-w-50">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Items</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateStockTargetIndex(null)
                    setShowCreateStockItem(true)
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-accent"
                >
                  Add Stock Item
                </button>
                <button
                  type="button"
                  onClick={addPurchaseItem}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>

            {showCreateStockItem && (
              <div className="border rounded-md p-4 mb-4 bg-muted/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">New Stock Item</div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateStockItem(false)
                      setCreateStockTargetIndex(null)
                      setNewStockItem({
                        name: '',
                        unit: '',
                        cost_per_unit: '',
                        reorder_level: '',
                      })
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={newStockItem.name}
                    onChange={(e) => setNewStockItem((p) => ({ ...p, name: e.target.value }))}
                    className="px-3 py-2 border rounded-md"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={newStockItem.unit}
                    onChange={(e) => setNewStockItem((p) => ({ ...p, unit: e.target.value }))}
                    className="px-3 py-2 border rounded-md"
                    placeholder="Unit (e.g., kg, pcs)"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newStockItem.cost_per_unit}
                    onChange={(e) => setNewStockItem((p) => ({ ...p, cost_per_unit: e.target.value }))}
                    className="px-3 py-2 border rounded-md"
                    placeholder={`Cost/Unit (${currencySymbol})`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newStockItem.reorder_level}
                    onChange={(e) => setNewStockItem((p) => ({ ...p, reorder_level: e.target.value }))}
                    className="px-3 py-2 border rounded-md"
                    placeholder="Reorder level"
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateStockItem}
                    disabled={creatingStockItem}
                    className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
                  >
                    {creatingStockItem ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {purchaseItems.map((item, index) => (
                <div key={index} className="border p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Product</label>
                      <select
                        // We need to determine if the current ingredient_id matches a simple item to show the correct selection
                        // This is a bit tricky because multiple simple items could map to same ingredient.
                        // We'll rely on the user selection. If they change it, we update. 
                        // For display value, we can try to find if it matches a known simple item or ingredient.
                        value={
                           // Try to find if this ingredient ID is associated with the name we stored
                           // This is imperfect but works for the UI state
                           simpleItems.find(si => si.ingredient_id === item.ingredient_id && si.name === item.ingredient_name) 
                             ? `item_${simpleItems.find(si => si.ingredient_id === item.ingredient_id && si.name === item.ingredient_name)?.id}`
                             : item.ingredient_id
                        }
                        onChange={(e) => updatePurchaseItem(index, 'ingredient_id', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select product</option>
                        <option value="__create_stock_item__">+ Create stock item…</option>
                        
                        {simpleItems.length > 0 && (
                          <optgroup label="Simple Items">
                            {simpleItems.map((si) => {
                              const ing = ingredients.find(i => i.id === si.ingredient_id)
                              return (
                                <option key={si.id} value={`item_${si.id}`}>
                                  {si.name} {ing ? `(Current: ${formatCurrency(Number(ing.cost_per_unit))}/${ing.unit})` : ''}
                                </option>
                              )
                            })}
                          </optgroup>
                        )}

                        <optgroup label="Stock Items">
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} (Current: {formatCurrency(Number(ing.cost_per_unit))}/{ing.unit})
                            </option>
                          ))}
                        </optgroup>
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
                        onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Unit Price ({currencySymbol})</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updatePurchaseItem(index, 'unit_price', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="w-full text-right py-2">
                        <div className="text-lg font-bold">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </div>
                        {item.unit_price !== item.current_cost && (
                          <div className="text-xs text-muted-foreground">
                            Previous: {formatCurrency(item.current_cost)}
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
                  No items added yet. Click &quot;Add Item&quot; to start adding products.
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
                <span>{formatCurrency(calculateTotals())}</span>
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
