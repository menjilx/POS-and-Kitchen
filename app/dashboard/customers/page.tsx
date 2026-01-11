import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from "lucide-react"
import { DataTable } from '@/components/data-table'
import { columns, Customer } from './columns'

export default async function CustomersPage() {
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

  const { data: customersData } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', currentUser.tenant_id)
    .order('created_at', { ascending: false })

  const customers = (customersData || []) as unknown as Customer[]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer base</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <DataTable columns={columns} data={customers} />
    </div>
  )
}
