import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function PurchasesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/login')

  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers (name),
      purchase_items (
        *,
        ingredients (name, unit)
      )
    `)
    .eq('tenant_id', userData.tenant_id)
    .order('invoice_date', { ascending: false })
    .limit(50)

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
        <h1 className="text-3xl font-bold">Purchases</h1>
        <a
          href="/dashboard/purchases/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Purchase
        </a>
      </div>

      <div className="bg-card rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Invoice #</th>
              <th className="text-left p-4">Supplier</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Items</th>
              <th className="text-left p-4">Total Amount</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases?.map((purchase) => (
              <tr key={purchase.id} className="border-b hover:bg-accent">
                <td className="p-4 font-medium">{purchase.invoice_number || '-'}</td>
                <td className="p-4">{purchase.suppliers?.name || '-'}</td>
                <td className="p-4">
                  {new Date(purchase.invoice_date).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {purchase.purchase_items?.length || 0} items
                </td>
                <td className="p-4 font-medium">
                  {formatCurrency(Number(purchase.total_amount), currency)}
                </td>
                <td className="p-4">
                  <a
                    href={`/dashboard/purchases/${purchase.id}`}
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
