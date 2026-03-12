import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import type { Ingredient, IngredientCategory } from '@/types/database'

type IngredientStatus = 'active' | 'deactivated'

const ingredientStatuses = ['active', 'deactivated'] as const

async function updateIngredient(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    throw new Error('Unauthorized')
  }

  const ingredientId = formData.get('ingredientId') as string
  const name = formData.get('name') as string
  const categoryId = formData.get('categoryId') as string
  const unit = formData.get('unit') as string
  const costPerUnit = parseFloat(formData.get('costPerUnit') as string)
  const usageUnit = formData.get('usageUnit') as string
  const conversionFactor = parseFloat(formData.get('conversionFactor') as string)
  const reorderLevel = parseFloat(formData.get('reorderLevel') as string)
  const statusRaw = String(formData.get('status') ?? '')
  const status: IngredientStatus = (ingredientStatuses as readonly string[]).includes(statusRaw)
    ? (statusRaw as IngredientStatus)
    : 'active'

  const { error } = await supabase
    .from('ingredients')
    .update({
      name,
      category_id: categoryId || null,
      unit,
      cost_per_unit: costPerUnit,
      usage_unit: usageUnit || unit,
      conversion_factor: conversionFactor || 1,
      reorder_level: reorderLevel,
      status,
    })
    .eq('id', ingredientId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/ingredients')
  redirect('/dashboard/ingredients')
}

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const [ingredient, categories] = await Promise.all([
    supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('ingredient_categories')
      .select('*')
      .order('name'),
  ])

  if (ingredient.error || !ingredient.data) {
    notFound()
  }

  const ingredientRow = ingredient.data as Ingredient
  const categoryRows = ((categories.data ?? []) as unknown) as IngredientCategory[]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ingredients" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Stock Item</h1>
      </div>

      <form action={updateIngredient} className="bg-card rounded-lg border p-6 space-y-6">
        <input type="hidden" name="ingredientId" value={ingredientRow.id} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            defaultValue={ingredientRow.name}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="usage_unit" className="block text-sm font-medium mb-2">
              Usage Unit (Recipe Unit)
            </label>
            <input
              id="usage_unit"
              type="text"
              name="usageUnit"
              defaultValue={ingredientRow.usage_unit || ingredientRow.unit}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. ml, g"
            />
          </div>

          <div>
            <label htmlFor="conversion_factor" className="block text-sm font-medium mb-2">
              Conversion Factor
            </label>
            <input
              id="conversion_factor"
              type="number"
              name="conversionFactor"
              step="0.0001"
              defaultValue={ingredientRow.conversion_factor || 1}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. 1000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many Usage Units are in one Stock Unit?
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <select
            id="category"
            name="categoryId"
            defaultValue={ingredientRow.category_id || ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category (optional)</option>
            {categoryRows.map((cat) => (
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
              name="unit"
              required
              defaultValue={ingredientRow.unit}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="cost_per_unit" className="block text-sm font-medium mb-2">
              Cost per Unit
            </label>
            <input
              id="cost_per_unit"
              type="number"
              name="costPerUnit"
              step="0.01"
              required
              defaultValue={ingredientRow.cost_per_unit}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reorder_level" className="block text-sm font-medium mb-2">
            Reorder Level
          </label>
          <input
            id="reorder_level"
            type="number"
            name="reorderLevel"
            step="0.01"
            required
            defaultValue={ingredientRow.reorder_level}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={ingredientRow.status ?? 'active'}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Update Stock Item
        </button>
      </form>
    </div>
  )
}
