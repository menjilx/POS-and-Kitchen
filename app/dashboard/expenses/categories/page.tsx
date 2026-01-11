import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ExpenseCategoriesPage() {
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

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expense Categories</h1>
        <a
          href="/dashboard/expenses/categories/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Category
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <div key={category.id} className="bg-card rounded-lg border p-6">
            <h3 className="text-xl font-bold">{category.name}</h3>
            
            {category.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {category.description}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              {/* Edit link could go here if implemented, for now basic listing is fine or we add it later */}
            </div>
          </div>
        ))}
        {categories?.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                No expense categories found. Create one to get started.
            </div>
        )}
      </div>
    </div>
  )
}
