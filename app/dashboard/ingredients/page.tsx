import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function IngredientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select(`
      *,
      ingredient_categories (name)
    `)
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userData.tenant_id)
    .single()

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ingredients</h1>
        <div className="flex gap-4">
          <Link
            href="/dashboard/ingredient-categories"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Manage Categories
          </Link>
          <Link
            href="/dashboard/ingredients/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Add Ingredient
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Stock Unit</th>
              <th className="text-left p-4">Usage Unit</th>
              <th className="text-left p-4">Conversion</th>
              <th className="text-left p-4">Cost/Unit</th>
              <th className="text-left p-4">Reorder Level</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients?.map((ingredient) => (
              <tr key={ingredient.id} className="border-b hover:bg-accent">
                <td className="p-4">{ingredient.name}</td>
                <td className="p-4">
                  {ingredient.ingredient_categories?.name || '-'}
                </td>
                <td className="p-4">{ingredient.unit}</td>
                <td className="p-4">{ingredient.usage_unit || '-'}</td>
                <td className="p-4">
                  {ingredient.conversion_factor && ingredient.conversion_factor !== 1
                    ? `1 ${ingredient.unit} = ${ingredient.conversion_factor} ${ingredient.usage_unit || ''}`
                    : '-'}
                </td>
                <td className="p-4">
                  {formatCurrency(Number(ingredient.cost_per_unit), currency)}
                </td>
                <td className="p-4">{ingredient.reorder_level}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      ingredient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ingredient.status}
                  </span>
                </td>
                <td className="p-4">
                  <Link
                    href={`/dashboard/ingredients/${ingredient.id}`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
