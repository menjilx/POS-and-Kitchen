import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LocationsPage() {
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

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Locations</h1>
        <a
          href="/dashboard/locations/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Location
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations?.map((location) => (
          <div key={location.id} className="bg-card rounded-lg border p-6">
            <h3 className="text-xl font-bold">{location.name}</h3>
            
            {location.address && (
              <p className="text-sm text-muted-foreground mt-2">
                {location.address}
              </p>
            )}

            <div className="mt-4">
              <a
                href={`/dashboard/locations/${location.id}`}
                className="w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Edit
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
