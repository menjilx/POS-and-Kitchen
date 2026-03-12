import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IngredientsTable } from './ingredients-table'
import type { Ingredient } from './columns'

export default async function IngredientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    redirect('/dashboard')
  }

  const { data: ingredientsData } = await supabase
    .from('ingredients')
    .select(`
      *,
      ingredient_categories (name)
    `)
    .order('name')

  const { data: currencySetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'currency')
    .single()

  const currency = currencySetting?.value ?? 'USD'

  const ingredients = (ingredientsData || []) as unknown as Ingredient[]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Items</h1>
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
            Add Stock Item
          </Link>
        </div>
      </div>

      <IngredientsTable data={ingredients} currency={currency} />
    </div>
  )
}
