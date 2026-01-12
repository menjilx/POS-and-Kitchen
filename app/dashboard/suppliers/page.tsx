import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SuppliersPage() {
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

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Link
          href="/dashboard/suppliers/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Supplier
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.map((supplier) => (
          <div key={supplier.id} className="bg-card rounded-lg border p-6">
            <h3 className="text-xl font-bold mb-4">{supplier.name}</h3>
            
            {supplier.contact_person && (
              <p className="text-sm text-muted-foreground mb-2">
                Contact: {supplier.contact_person}
              </p>
            )}
            
            {supplier.email && (
              <p className="text-sm text-muted-foreground mb-2">
                Email: {supplier.email}
              </p>
            )}
            
            {supplier.phone && (
              <p className="text-sm text-muted-foreground mb-2">
                Phone: {supplier.phone}
              </p>
            )}
            
            {supplier.address && (
              <p className="text-sm text-muted-foreground mb-4">
                {supplier.address}
              </p>
            )}

            <div className="flex gap-2">
              <Link
                href={`/dashboard/suppliers/${supplier.id}`}
                className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
