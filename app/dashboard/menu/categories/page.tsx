import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MenuCategoriesPage() {
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

  const [{ data: categories }, { data: menuSetting }] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('app_settings').select('value').eq('key', 'features_menu').single(),
  ])

  const menuEnabled = menuSetting?.value !== 'false'
  if (!menuEnabled) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu" className="text-primary hover:underline">
          ← Back to Menu
        </Link>
        <h1 className="text-3xl font-bold">Menu Categories</h1>
      </div>

      <div className="flex justify-end">
        <Link
          href="/dashboard/menu/categories/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Category
        </Link>
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
              <Link
                href={`/dashboard/menu/categories/${category.id}`}
                className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
        
        {categories?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
            No menu categories found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
