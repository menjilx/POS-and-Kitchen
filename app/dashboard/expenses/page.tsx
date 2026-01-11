import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExpensesTable } from './expenses-table'
import type { Expense } from './columns'

export default async function ExpensesPage() {
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

  const { data: expensesData } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_categories (name)
    `)
    .eq('tenant_id', userData.tenant_id)
    .order('expense_date', { ascending: false })
    .limit(100)

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userData.tenant_id)
    .single()

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  const expenses = (expensesData || []) as unknown as Expense[]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex gap-2">
          <a
            href="/dashboard/expenses/categories"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Manage Categories
          </a>
          <a
            href="/dashboard/expenses/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            New Expense
          </a>
        </div>
      </div>

      <ExpensesTable data={expenses} currency={currency} />
    </div>
  )
}
