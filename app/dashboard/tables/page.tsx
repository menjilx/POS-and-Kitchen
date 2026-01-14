import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function TablesPage() {
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

  const [{ data: tables }, { data: tenantData }] = await Promise.all([
    supabase
      .from('tables')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('table_number'),
    supabase
      .from('tenants')
      .select('settings')
      .eq('id', userData.tenant_id)
      .single(),
  ])

  const tenantSettings = tenantData?.settings as unknown as { features?: { menu?: boolean } } | null
  const menuEnabled = tenantSettings?.features?.menu ?? true
  if (!menuEnabled) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tables</h1>
        <Link
          href="/dashboard/tables/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Table
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables?.map((table) => (
          <div key={table.id} className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold">Table {table.table_number}</h3>
                <p className="text-sm text-muted-foreground">Capacity: {table.capacity}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  table.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : table.status === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : table.status === 'reserved'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {table.status}
              </span>
            </div>
            
            {table.location && (
              <p className="text-sm text-muted-foreground mb-2">
                Location: {table.location}
              </p>
            )}

            <div className="mt-4">
              <Link
                href={`/dashboard/tables/${table.id}`}
                className="w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
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
