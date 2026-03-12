import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from "lucide-react"
import { DataTable } from '@/components/data-table'
import { columns, Customer } from './columns'

export default async function CustomersPage() {
  const supabase = await createClient()

  const normalizeWalkInName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')

  const isReservedWalkInCustomerName = (value: string) => {
    const normalized = normalizeWalkInName(value)
    return (
      normalized === 'walk in' ||
      normalized === 'walk in customer' ||
      normalized === 'walkin' ||
      normalized === 'walkin customer'
    )
  }

  const isCanonicalWalkInCustomerName = (value: string) => normalizeWalkInName(value) === 'walk in'

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
    .order('created_at', { ascending: false })

  const allCustomers = (customersData || []) as Array<Record<string, unknown>>

  const reserved = allCustomers.filter((c) => isReservedWalkInCustomerName(String(c.name ?? '')))
  const nonReserved = allCustomers.filter((c) => !isReservedWalkInCustomerName(String(c.name ?? '')))

  const canonical = reserved.find((c) => isCanonicalWalkInCustomerName(String(c.name ?? '')))
  const reservedSortedOldestFirst = [...reserved].sort((a, b) => {
    const aTime = new Date(String(a.created_at ?? 0)).getTime()
    const bTime = new Date(String(b.created_at ?? 0)).getTime()
    return aTime - bTime
  })

  const keepReserved = canonical ?? reservedSortedOldestFirst[0]
  const customers = ([
    ...(keepReserved ? [keepReserved] : []),
    ...nonReserved,
  ] as unknown) as Customer[]

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
