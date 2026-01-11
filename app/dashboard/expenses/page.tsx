import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'

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

  const { data: expenses } = await supabase
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

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Description</th>
              <th className="text-left p-4">Amount</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses?.map((expense) => (
              <tr key={expense.id} className="border-b hover:bg-accent">
                <td className="p-4">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {expense.expense_categories?.name || '-'}
                </td>
                <td className="p-4">{expense.description}</td>
                <td className="p-4 font-medium">
                  {formatCurrency(Number(expense.amount), currency)}
                </td>
                <td className="p-4">
                  <a
                    href={`/dashboard/expenses/${expense.id}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
