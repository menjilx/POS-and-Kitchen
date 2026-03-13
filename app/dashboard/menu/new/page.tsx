'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { Trash2, Plus, Upload, X } from 'lucide-react'
import type { Ingredient } from '@/types/database'
import { useAppSettings } from '@/hooks/use-app-settings'
import { useToast } from '@/hooks/use-toast'

interface RecipeItem {
  ingredient_id: string
  quantity: number
  ingredient_name: string
}

export default function NewMenuItemPage() {
  const router = useRouter()
  const { settings, loading: settingsLoading, currencySymbol, formatCurrency } = useAppSettings()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    selling_price: '',
    waste_percentage: '0',
    labor_cost: '0',
    image_url: '',
  })
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])

  useEffect(() => {
    if (!settingsLoading && settings.features?.menu === false) router.replace('/dashboard')
  }, [router, settings.features?.menu, settingsLoading])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load ingredients
    const { data: ingredientsData } = await supabase
      .from('ingredients')
      .select('*')
      .eq('status', 'active')
      .order('name')

    setIngredients(((ingredientsData ?? []) as unknown) as Ingredient[])

    // Load categories
    const { data: categoriesData } = await supabase
      .from('menu_categories')
      .select('id, name')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    setCategories(categoriesData ?? [])
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadData])

  const addRecipeItem = () => {
    if (ingredients.length === 0) {
      toast({
        title: "No ingredients found",
        description: "Please add ingredients in the Inventory section first.",
        variant: "destructive"
      })
      return
    }
    const firstIngredient = ingredients[0]
    if (!firstIngredient) return

    setRecipeItems([
      ...recipeItems,
      {
        ingredient_id: firstIngredient.id,
        quantity: 1,
        ingredient_name: firstIngredient.name,
      },
    ])
  }

  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index))
  }

  const updateRecipeItem = (index: number, field: 'ingredient_id' | 'quantity', value: string) => {
    const updated = [...recipeItems]
    if (field === 'ingredient_id') {
      const ingredient = ingredients.find((i) => i.id === value)
      updated[index] = { ...updated[index], [field]: value, ingredient_name: ingredient?.name || '' }
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) }
    }
    setRecipeItems(updated)
  }

  const calculateTotals = () => {
    let foodCost = 0
    recipeItems.forEach(item => {
      const ingredient = ingredients.find((i) => i.id === item.ingredient_id)
      if (ingredient) {
        const conversionFactor = ingredient.conversion_factor || 1
        foodCost += (item.quantity / conversionFactor) * Number(ingredient.cost_per_unit)
      }
    })

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: menuItem } = await supabase
        .from('menu_items')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          selling_price: Number(formData.selling_price),
          waste_percentage: Number(formData.waste_percentage),
          labor_cost: Number(formData.labor_cost),
          image_url: formData.image_url,
          item_type: 'standard',
        })
        .select()
        .single()

      if (!menuItem) throw new Error('Failed to create menu item')

      if (recipeItems.length > 0) {
        const recipeInserts = recipeItems.map(item => ({
          menu_item_id: menuItem.id,
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
        }))

        const { error: recipeError } = await supabase
          .from('recipe_items')
          .insert(recipeInserts)

        if (recipeError) throw recipeError
      }

      router.push('/dashboard/menu')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Add Menu Item</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Delicious homemade burger"
                />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="waste_percentage" className="block text-sm font-medium mb-2">
                    Waste %
                  </label>
                  <input
                    id="waste_percentage"
                    type="number"
                    step="0.1"
                    value={formData.waste_percentage}
                    onChange={(e) => setFormData({ ...formData, waste_percentage: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label htmlFor="labor_cost" className="block text-sm font-medium mb-2">
                    Labor Cost ({currencySymbol})
                  </label>
                  <input
                    id="labor_cost"
                    type="number"
                    step="0.01"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="2.00"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recipe</h2>
              <button
                type="button"
                onClick={addRecipeItem}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            <div className="space-y-3">
              {recipeItems.map((item, index) => {
                const ingredient = ingredients.find((i) => i.id === item.ingredient_id)
                const unit = ingredient?.usage_unit || ingredient?.unit || ''
                const cost = ingredient 
                  ? (item.quantity / (ingredient.conversion_factor || 1)) * Number(ingredient.cost_per_unit)
                  : 0

                return (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="flex-1 flex flex-col gap-1">
                      <select
                        value={item.ingredient_id}
                        onChange={(e) => updateRecipeItem(index, 'ingredient_id', e.target.value)}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({formatCurrency(Number(ing.cost_per_unit))}/{ing.unit})
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-muted-foreground px-1">
                        Cost: {formatCurrency(cost)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateRecipeItem(index, 'quantity', e.target.value)}
                        className="w-24 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Qty"
                      />
                      <span className="text-sm text-muted-foreground w-8 truncate" title={unit}>
                        {unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRecipeItem(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}

              {recipeItems.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground">
                    No ingredients added yet. Click &quot;Add Ingredient&quot; to start building your recipe.
                  </p>
                  {ingredients.length === 0 && (
                    <Link href="/dashboard/ingredients/new" target="_blank" className="text-primary hover:underline text-sm block">
                      No ingredients found? Create your first ingredient here
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Cost Calculator</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ingredients Cost:</span>
                <span className="font-medium">{formatCurrency(totals.foodCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Waste Cost ({formData.waste_percentage}%):</span>
                <span className="font-medium">{formatCurrency(totals.wasteCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor Cost:</span>
                <span className="font-medium">{formatCurrency(Number(formData.labor_cost))}</span>
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
              disabled={loading || !formData.name || !formData.selling_price}
              className="w-full mt-6 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Menu Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
