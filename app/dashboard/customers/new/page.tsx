import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CustomerForm } from '@/components/customers/customer-form'

export default async function NewCustomerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentUser) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Customer</h1>
        <p className="text-muted-foreground">Add a new customer to your database</p>
      </div>
      <CustomerForm tenantId={currentUser.tenant_id} />
    </div>
  )
}
