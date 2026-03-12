'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2, Paperclip, X } from 'lucide-react'
import type { Ingredient, Location, Supplier } from '@/types/database'
import { useTenantSettings } from '@/hooks/use-tenant-settings'
import { uploadFile } from '@/app/actions/storage'

type PurchaseItemDraft = {
  id?: string // Include ID for tracking existing items
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

type PurchaseAttachment = {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
  purchase_id: string
}

export default function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { currencySymbol, formatCurrency } = useTenantSettings()
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplier_id: '',
    invoice_number: '',
    invoice_date: '',
    notes: '',
  })
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemDraft[]>([])
  const [loading, setLoading] = useState(true) // Start with loading true
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<PurchaseAttachment[]>([])
  const [simpleItems, setSimpleItems] = useState<{ id: string, name: string, ingredient_id: string }[]>([])

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch master data
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
          .order('name'),
      ])

      const ingredientsData = ((ingredientsRes.data ?? []) as unknown) as Ingredient[]
      setIngredients(ingredientsData)
      setSuppliers(((suppliersRes.data ?? []) as unknown) as Supplier[])
      setLocations(((locationsRes.data ?? []) as unknown) as Location[])

      const simpleMenuItems = (simpleMenuItemsRes.data ?? []) as Array<{ id: string; name: string; stock_ingredient_id: string | null }>
      if (simpleMenuItems.length > 0) {
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
      } else {
        setSimpleItems([])
      }

      // Fetch purchase data
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          *,
          purchase_items (
            id,
            ingredient_id,
            quantity,
            unit_price,
            location_id,
            ingredients (name, unit, cost_per_unit)
          ),
          purchase_attachments (*)
        `)
        .eq('id', id)
        .single()

      if (purchaseError) throw purchaseError
      if (!purchase) throw new Error('Purchase not found')

      setFormData({
        supplier_id: purchase.supplier_id || '',
        invoice_number: purchase.invoice_number || '',
        invoice_date: purchase.invoice_date || '',
        notes: purchase.notes || '',
      })

      // Map existing items
      const items = purchase.purchase_items.map((item: {
        id: string
        ingredient_id: string
        ingredients: { name: string; unit: string; cost_per_unit: number } | null
        quantity: number
        unit_price: number
        location_id: string
      }) => ({
        id: item.id,
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredients?.name || '',
        unit: item.ingredients?.unit || '',
        current_cost: Number(item.ingredients?.cost_per_unit) || 0,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        location_id: item.location_id,
      }))
      setPurchaseItems(items)

      setExistingAttachments(purchase.purchase_attachments || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load purchase data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadData()
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
        ingredient_name: displayName || ingredient?.name || '',
        unit: ingredient?.unit || '',
        current_cost: Number(ingredient?.cost_per_unit) || 0,
        unit_price: Number(ingredient?.cost_per_unit) || 0,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleRemoveExistingAttachment = async (attachmentId: string) => {
    try {
        const { error } = await supabase
            .from('purchase_attachments')
            .delete()
            .eq('id', attachmentId)
        
        if (error) throw error
        
        setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId))
    } catch (err) {
        console.error('Error removing attachment:', err)
        // Optionally show a toast error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (purchaseItems.length === 0) {
      setError('Please add at least one item')
      setSaving(false)
      return
    }

    try {
      const totalAmount = calculateTotals()

      // 1. Update purchase details
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({
          supplier_id: formData.supplier_id || null,
          invoice_number: formData.invoice_number || null,
          invoice_date: formData.invoice_date,
          total_amount: totalAmount,
          notes: formData.notes,
        })
        .eq('id', id)

      if (purchaseError) throw new Error(purchaseError.message)

      // 2. Handle Purchase Items
      // Get current items from DB to compare for deletions
      const { data: currentDbItems } = await supabase
        .from('purchase_items')
        .select('id')
        .eq('purchase_id', id)
      
      const currentDbIds = currentDbItems?.map(i => i.id) || []
      const submittedIds = purchaseItems.map(i => i.id).filter(Boolean) as string[]
      
      // Identify items to delete
      const idsToDelete = currentDbIds.filter(id => !submittedIds.includes(id))
      
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('purchase_items')
            .delete()
            .in('id', idsToDelete)
        if (deleteError) throw new Error(deleteError.message)
      }

      // Upsert items (Insert new ones, Update existing ones)
      const itemsToUpsert = purchaseItems.map(item => ({
        id: item.id, // If present, it updates. If undefined, it inserts (but we need to remove undefined ID for insert or let Supabase handle it?)
                     // Actually, Supabase upsert needs the primary key to match. 
                     // For new items, we shouldn't send 'id'.
        purchase_id: id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        location_id: item.location_id,
      }))

      // Split into insert and update to be safe, or just upsert.
      // Upsert works if we provide the ID. New items don't have ID.
      // We can do it in a loop or separate arrays.
      
      const itemsToUpdate = itemsToUpsert.filter(i => i.id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const itemsToInsert = itemsToUpsert.filter(i => !i.id).map(({ id: _, ...rest }) => rest)

      if (itemsToUpdate.length > 0) {
        for (const item of itemsToUpdate) {
            const { error: updateError } = await supabase
                .from('purchase_items')
                .update(item)
                .eq('id', item.id)
            if (updateError) throw new Error(updateError.message)
        }
      }

      if (itemsToInsert.length > 0) {
         const { error: insertError } = await supabase
            .from('purchase_items')
            .insert(itemsToInsert)
         if (insertError) throw new Error(insertError.message)
      }

      // 3. Upload new files
      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          const result = await uploadFile(formData)
          if (!result.success || !result.url) {
            throw new Error(`Failed to upload file ${file.name}: ${result.error}`)
          }
          return {
            purchase_id: id,
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

      router.push(`/dashboard/purchases/${id}`)
      router.refresh()
    } catch (err) {
      console.error('Purchase update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update purchase')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
      return <div className="p-8 text-center">Loading purchase details...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/purchases/${id}`} className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Purchase</h1>
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
                
                {existingAttachments.length > 0 && (
                    <div className="mb-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Existing Files:</p>
                        {existingAttachments.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 border rounded-md">
                                <span className="text-sm truncate max-w-50">{file.file_name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExistingAttachment(file.id)}
                                    className="text-destructive hover:text-destructive/80"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    <Paperclip size={16} />
                    <span>Attach New Files</span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {files.length} new file(s) selected
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
                      <label className="block text-sm font-medium mb-1">Product</label>
                      <select
                        value={
                          simpleItems.find(si => si.ingredient_id === item.ingredient_id && si.name === item.ingredient_name) 
                            ? `item_${simpleItems.find(si => si.ingredient_id === item.ingredient_id && si.name === item.ingredient_name)?.id}`
                            : item.ingredient_id
                        }
                        onChange={(e) => updatePurchaseItem(index, 'ingredient_id', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select product</option>

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
              disabled={saving || purchaseItems.length === 0}
              className="w-full mt-6 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
