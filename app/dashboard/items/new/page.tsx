'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { Upload, X, Package } from 'lucide-react'
import { useTenantSettings } from '@/hooks/use-tenant-settings'
import { useToast } from '@/hooks/use-toast'

export default function NewSimpleMenuItemPage() {
  const router = useRouter()
  const { settings, loading: settingsLoading, currencySymbol, formatCurrency } = useTenantSettings()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    selling_price: '',
    waste_percentage: '0',
    labor_cost: '0',
    image_url: '',
    stock_unit: 'pcs',
    cost_per_unit: '',
    reorder_level: '10',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])

  useEffect(() => {
    if (!settingsLoading && settings.features?.menu === false) router.replace('/dashboard')
  }, [router, settings.features?.menu, settingsLoading])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('tenant_id', userData.tenant_id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      setCategories(categoriesData ?? [])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadData])

  const calculateTotals = () => {
    const foodCost = Number(formData.cost_per_unit) || 0
    const wastePercent = Number(formData.waste_percentage) / 100
    const wasteCost = foodCost * wastePercent
    const foodCostWithWaste = foodCost + wasteCost
    const laborCost = Number(formData.labor_cost)
    const totalCost = foodCostWithWaste + laborCost
    const sellingPrice = Number(formData.selling_price) || 0
    const margin = sellingPrice - totalCost
    const marginPercent = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0

    return { foodCost, wasteCost, foodCostWithWaste, totalCost, margin, marginPercent }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const nameExt = file.name.includes('.') ? file.name.split('.').pop() : undefined
      const typeExt = file.type.includes('/') ? file.type.split('/').pop() : undefined
      const fileExt = (nameExt || typeExt || 'png').toLowerCase()
      const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const filePath = `${user.id}/${uuid}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { upsert: true, contentType: file.type || undefined })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error uploading image",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      e.target.value = ''
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const name = formData.name.trim()
      const unit = formData.stock_unit.trim()
      const costPerUnit = Number(formData.cost_per_unit)
      const reorderLevel = formData.reorder_level === '' ? undefined : Number(formData.reorder_level)

      if (!name) throw new Error('Name is required')
      if (!unit) throw new Error('Stock unit is required')
      if (Number.isNaN(costPerUnit)) throw new Error('Cost per unit must be a number')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const { data: createdIngredient, error: ingredientError } = await supabase
        .from('ingredients')
        .insert({
          tenant_id: userData.tenant_id,
          name,
          category_id: null,
          unit,
          cost_per_unit: costPerUnit,
          reorder_level: reorderLevel ?? 10,
          status: 'active',
          usage_unit: unit,
          conversion_factor: 1,
        })
        .select('id')
        .single()

      if (ingredientError) throw ingredientError
      if (!createdIngredient?.id) throw new Error('Failed to create stock item')

      const { data: menuItem, error: menuItemError } = await supabase
        .from('menu_items')
        .insert({
          tenant_id: userData.tenant_id,
          name,
          description: formData.description || name,
          category: formData.category,
          selling_price: Number(formData.selling_price),
          waste_percentage: Number(formData.waste_percentage),
          labor_cost: Number(formData.labor_cost),
          image_url: formData.image_url,
          item_type: 'simple',
          stock_ingredient_id: createdIngredient.id,
        })
        .select()
        .single()

      if (menuItemError) {
        await supabase
          .from('ingredients')
          .delete()
          .eq('id', createdIngredient.id)
          .eq('tenant_id', userData.tenant_id)
        throw menuItemError
      }
      if (!menuItem) throw new Error('Failed to create menu item')

      router.push('/dashboard/items')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/items" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Add Simple Item</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">
              Item Details
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
                  <p className="text-sm text-blue-700 flex gap-2">
                    <Package className="h-4 w-4 mt-0.5" />
                    Simple Items create their own stock item automatically.
                  </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Image
                </label>
                <div className="flex items-center gap-4">
                  {formData.image_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <Image 
                        src={formData.image_url} 
                        alt="Preview" 
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground bg-muted/50">
                      <Upload size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                    >
                      {formData.image_url ? 'Change Image' : 'Upload Image'}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Burger"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="stock_unit" className="block text-sm font-medium mb-2">
                    Stock Unit
                  </label>
                  <input
                    id="stock_unit"
                    type="text"
                    required
                    value={formData.stock_unit}
                    onChange={(e) => setFormData({ ...formData, stock_unit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="pcs"
                  />
                </div>
                <div>
                  <label htmlFor="cost_per_unit" className="block text-sm font-medium mb-2">
                    Cost per unit ({currencySymbol})
                  </label>
                  <input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="reorder_level" className="block text-sm font-medium mb-2">
                    Reorder Level
                  </label>
                  <input
                    id="reorder_level"
                    type="number"
                    step="0.01"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="category" className="block text-sm font-medium">
                    Category
                  </label>
                  <Link href="/dashboard/menu/categories" className="text-xs text-primary hover:underline" target="_blank">
                    Manage Categories
                  </Link>
                </div>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No categories found. <Link href="/dashboard/menu/categories/new" className="text-primary hover:underline">Create one</Link>.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="selling_price" className="block text-sm font-medium mb-2">
                  Selling Price ({currencySymbol})
                </label>
                <input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="15.99"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Cost Calculator</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost/Unit:</span>
                <span className="font-medium">{formatCurrency(totals.foodCost)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Total Cost:</span>
                <span className="font-bold">{formatCurrency(totals.totalCost)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Margin:</span>
                <span className={`font-bold ${totals.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.margin)} ({totals.marginPercent.toFixed(1)}%)
                </span>
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.selling_price || !formData.cost_per_unit}
              className="w-full mt-6 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Simple Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
