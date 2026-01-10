'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'

interface RecipeItem {
  ingredient_id: string
  quantity: number
  ingredient_name: string
  tempId?: string
}

export default function EditMenuItemPage() {
  const router = useRouter()
  const [params] = useState(() => {
    const pathParts = window.location.pathname.split('/')
    return { id: pathParts[pathParts.length - 1] }
  })
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    selling_price: '',
    waste_percentage: '0',
    labor_cost: '0',
    status: 'active',
  })
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])

  useEffect(() => {
    loadMenuItem()
    loadIngredients()
  }, [params.id])

  const loadIngredients = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      const { data } = await supabase
        .from('ingredients')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('status', 'active')
        .order('name')

      setIngredients(data || [])
    }
  }

  const loadMenuItem = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (userData && params.id) {
      const [menuItem, recipes] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('id', params.id)
          .eq('tenant_id', userData.tenant_id)
          .single(),
        supabase
          .from('recipe_items')
          .select(`
            *,
            ingredients (name)
          `)
          .eq('menu_item_id', params.id),
      ])

      if (menuItem?.data) {
        setFormData({
          name: menuItem.data.name,
          description: menuItem.data.description || '',
          category: menuItem.data.category || '',
          selling_price: menuItem.data.selling_price.toString(),
          waste_percentage: menuItem.data.waste_percentage.toString(),
          labor_cost: menuItem.data.labor_cost.toString(),
          status: menuItem.data.status,
        })
      }

      if (recipes?.data) {
        setRecipeItems(recipes.data.map((r: any) => ({
          ingredient_id: r.ingredient_id,
          quantity: r.quantity,
          ingredient_name: r.ingredients?.name || 'Unknown',
          tempId: r.id,
        })))
      }
    }
  }

  const addRecipeItem = () => {
    if (ingredients.length === 0) return
    setRecipeItems([
      ...recipeItems,
      {
        ingredient_id: ingredients[0].id,
        quantity: 1,
        ingredient_name: ingredients[0].name,
        tempId: `new-${Date.now()}`,
      },
    ])
  }

  const removeRecipeItem = (tempId?: string, index?: number) => {
    if (tempId && tempId.startsWith('new-')) {
      setRecipeItems(recipeItems.filter((item, i) => i !== index))
    } else if (tempId) {
      setRecipeItems(recipeItems.filter(item => item.tempId !== tempId))
    }
  }

  const updateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
    const updated = [...recipeItems]
    if (field === 'ingredient_id') {
      const ingredient = ingredients.find(i => i.id === value)
      updated[index] = { ...updated[index], [field]: value, ingredient_name: ingredient?.name || '' }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setRecipeItems(updated)
  }

  const calculateTotals = () => {
    let foodCost = 0
    recipeItems.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredient_id)
      if (ingredient) {
        foodCost += item.quantity * Number(ingredient.cost_per_unit)
      }
    })

    const wastePercent = Number(formData.waste_percentage) / 100
    const foodCostWithWaste = foodCost * (1 + wastePercent)
    const laborCost = Number(formData.labor_cost)
    const totalCost = foodCostWithWaste + laborCost
    const sellingPrice = Number(formData.selling_price) || 0
    const margin = sellingPrice - totalCost
    const marginPercent = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0

    return { foodCostWithWaste, totalCost, margin, marginPercent }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
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

      const { error: updateError } = await supabase
        .from('menu_items')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          selling_price: Number(formData.selling_price),
          waste_percentage: Number(formData.waste_percentage),
          labor_cost: Number(formData.labor_cost),
          status: formData.status as any,
        })
        .eq('id', params.id)
        .eq('tenant_id', userData.tenant_id)

      if (updateError) throw updateError

      const newItems = recipeItems.filter(item => item.tempId?.startsWith('new-'))
      const existingItems = recipeItems.filter(item => !item.tempId?.startsWith('new-'))

      if (newItems.length > 0) {
        const recipeInserts = newItems.map(item => ({
          menu_item_id: params.id,
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
        }))

        const { error: recipeError } = await supabase
          .from('recipe_items')
          .insert(recipeInserts)

        if (recipeError) throw recipeError
      }

      const { error: deleteError } = await supabase
        .from('recipe_items')
        .delete()
        .in('id', existingItems.map(item => item.tempId).filter(Boolean) as string[])

      if (deleteError) throw deleteError

      router.push('/dashboard/menu')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/menu" className="text-primary hover:underline">
          ← Back
        </a>
        <h1 className="text-3xl font-bold">Edit Menu Item</h1>
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
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category
                </label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="selling_price" className="block text-sm font-medium mb-2">
                  Selling Price ($)
                </label>
                <input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  />
                </div>

                <div>
                  <label htmlFor="labor_cost" className="block text-sm font-medium mb-2">
                    Labor Cost ($)
                  </label>
                  <input
                    id="labor_cost"
                    type="number"
                    step="0.01"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
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
              {recipeItems.map((item, index) => (
                <div key={item.tempId} className="flex gap-3 items-center">
                  <select
                    value={item.ingredient_id}
                    onChange={(e) => updateRecipeItem(index, 'ingredient_id', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} (${Number(ing.cost_per_unit).toFixed(2)}/{ing.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateRecipeItem(index, 'quantity', parseFloat(e.target.value))}
                    className="w-24 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <button
                    type="button"
                    onClick={() => removeRecipeItem(item.tempId, index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {recipeItems.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No ingredients in recipe. Click "Add Ingredient" to start building.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Cost Calculator</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Food Cost:</span>
                <span className="font-medium">${totals.foodCostWithWaste.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor Cost:</span>
                <span className="font-medium">${Number(formData.labor_cost).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Total Cost:</span>
                <span className="font-bold">${totals.totalCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Margin:</span>
                <span className={`font-bold ${totals.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totals.margin.toFixed(2)} ({totals.marginPercent.toFixed(1)}%)
                </span>
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.selling_price}
              className="w-full mt-6 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Menu Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
