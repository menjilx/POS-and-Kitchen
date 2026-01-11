import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import type { IngredientCategory } from '@/types/database'

async function updateCategory(formData: FormData) {
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

  const categoryId = formData.get('categoryId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('ingredient_categories')
    .update({
      name,
      description: description || null,
      status,
    })
    .eq('id', categoryId)
    .eq('tenant_id', userData.tenant_id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/ingredient-categories')
  redirect('/dashboard/ingredient-categories')
}

export default async function EditCategoryPage({
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
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const { data: category } = await supabase
    .from('ingredient_categories')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', userData.tenant_id)
    .single()

  if (!category) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ingredient-categories" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Category</h1>
      </div>

      <form action={updateCategory} className="bg-card rounded-lg border p-6 space-y-6">
        <input type="hidden" name="categoryId" value={category.id} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Category Name *
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            defaultValue={category.name}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Vegetables, Meats, Dairy"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={category.description || ''}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Optional description of this category..."
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={category.status || 'active'}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
