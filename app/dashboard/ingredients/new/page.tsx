'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { IngredientCategory } from '@/types/database'

type IngredientStatus = 'active' | 'deactivated'

type IngredientFormData = {
  name: string
  category_id: string
  unit: string
  cost_per_unit: string
  usage_unit: string
  conversion_factor: string
  reorder_level: string
  status: IngredientStatus
}


export default function NewIngredientPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    category_id: '',
    unit: '',
    cost_per_unit: '',
    usage_unit: '',
    conversion_factor: '1',
    reorder_level: '10',
    status: 'active',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<IngredientCategory[]>([])

  const loadCategories = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ingredient_categories')
      .select('*')
      .order('name')

    setCategories(((data ?? []) as unknown) as IngredientCategory[])
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCategories()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('ingredients').insert({
        name: formData.name,
        category_id: formData.category_id || null,
        unit: formData.unit,
        cost_per_unit: parseFloat(formData.cost_per_unit),
        usage_unit: formData.usage_unit || formData.unit,
        conversion_factor: parseFloat(formData.conversion_factor) || 1,
        reorder_level: parseFloat(formData.reorder_level),
        status: formData.status,
      })

      if (error) throw error

      router.push('/dashboard/ingredients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stock item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ingredients" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Add Stock Item</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Tomato"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select category (optional)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium mb-2">
                Unit
              </label>
              <input
                id="unit"
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="kg, lbs, pieces"
              />
            </div>

            <div>
              <label htmlFor="cost_per_unit" className="block text-sm font-medium mb-2">
                Cost per Unit
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="usage_unit" className="block text-sm font-medium mb-2">
                Usage Unit (Recipe Unit)
              </label>
              <input
                id="usage_unit"
                type="text"
                value={formData.usage_unit}
                onChange={(e) => setFormData({ ...formData, usage_unit: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. ml, g (leave empty if same as Unit)"
              />
            </div>

            <div>
              <label htmlFor="conversion_factor" className="block text-sm font-medium mb-2">
                Conversion Factor
              </label>
              <input
                id="conversion_factor"
                type="number"
                step="0.0001"
                value={formData.conversion_factor}
                onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 1000 (if 1 Box = 1000 ml)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How many Usage Units are in one Stock Unit?
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="reorder_level" className="block text-sm font-medium mb-2">
              Reorder Level
            </label>
            <input
              id="reorder_level"
              type="number"
              step="0.01"
              required
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Stock Item'}
          </button>
        </form>
      </div>
    </div>
  )
}
