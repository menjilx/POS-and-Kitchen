import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function updateIngredient(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
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
  const reorderLevel = parseFloat(formData.get('reorderLevel') as string)
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('ingredients')
    .update({
      name,
      category_id: categoryId || null,
      unit,
      cost_per_unit: costPerUnit,
      reorder_level: reorderLevel,
      status,
    })
    .eq('id', ingredientId)
    .eq('tenant_id', userData.tenant_id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/ingredients')
  redirect('/dashboard/ingredients')
}

export default async function EditIngredientPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const [ingredient, categories] = await Promise.all([
    supabase
      .from('ingredients')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single(),
    supabase
      .from('ingredient_categories')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('name'),
  ])

  if (!ingredient) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/ingredients" className="text-primary hover:underline">
          ← Back
        </a>
        <h1 className="text-3xl font-bold">Edit Ingredient</h1>
      </div>

      <form action={updateIngredient} className="bg-card rounded-lg border p-6 space-y-6">
        <input type="hidden" name="ingredientId" value={ingredient?.data?.id} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            defaultValue={ingredient?.data?.name}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <select
            id="category"
            name="categoryId"
            defaultValue={ingredient?.data?.category_id || ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category (optional)</option>
            {categories?.data?.map((cat: any) => (
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
              defaultValue={ingredient?.data?.unit}
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
              defaultValue={ingredient?.data?.cost_per_unit}
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
            defaultValue={ingredient?.data?.reorder_level}
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
            defaultValue={ingredient?.data?.status}
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
          Update Ingredient
        </button>
      </form>
    </div>
  )
}
