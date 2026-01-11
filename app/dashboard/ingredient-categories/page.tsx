import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArchiveButton } from '@/components/ingredient-categories/archive-button'
import { cn } from '@/lib/utils'
import { Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function IngredientCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = params.status || 'active'
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
    .from('ingredient_categories')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .eq('status', status)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ingredient Categories</h1>
        <Link
          href="/dashboard/ingredient-categories/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Category
        </Link>
      </div>

      <div className="flex space-x-1 border-b">
        <Link
          href="/dashboard/ingredient-categories?status=active"
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors hover:text-primary",
            status === 'active'
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          Active
        </Link>
        <Link
          href="/dashboard/ingredient-categories?status=archived"
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors hover:text-primary",
            status === 'archived'
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          Archived
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No {status} categories found.
          </div>
        )}
        
        {categories?.map((category) => (
          <div key={category.id} className="bg-card rounded-lg border p-6 flex flex-col h-full">
            <div className="flex-1">
              <h3 className="text-xl font-bold">{category.name}</h3>
              
              {category.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {category.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/dashboard/ingredient-categories/${category.id}`}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <ArchiveButton 
                categoryId={category.id} 
                currentStatus={category.status as 'active' | 'archived'} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
