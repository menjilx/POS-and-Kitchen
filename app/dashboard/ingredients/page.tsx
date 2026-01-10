import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ingredients</h1>
        <a
          href="/dashboard/ingredients/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Ingredient
        </a>
      </div>

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Unit</th>
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
                <td className="p-4">
                  ${Number(ingredient.cost_per_unit).toFixed(2)}
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
                  <a
                    href={`/dashboard/ingredients/${ingredient.id}`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
