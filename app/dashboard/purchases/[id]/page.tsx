import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, DollarSign, Building, Paperclip, Download, Edit } from 'lucide-react'
import type { PurchaseItem, Ingredient, Location } from '@/types/database'

type PurchaseAttachment = {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}

type PurchaseItemWithDetails = PurchaseItem & {
  ingredients: Pick<Ingredient, 'name' | 'unit'> | null
  locations: Pick<Location, 'name'> | null
}

export default async function PurchaseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/login')

  // Fetch purchase details
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers (name),
      purchase_items (
        *,
        ingredients (name, unit),
        locations (name)
      ),
      purchase_attachments (*)
    `)
    .eq('id', id)
    .eq('tenant_id', userData.tenant_id)
    .single()

  if (error || !purchase) {
    notFound()
  }

  // Fetch tenant settings for currency
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', userData.tenant_id)
    .single()

  const tenantSettings = tenantData?.settings as unknown as { currency?: string } | null
  const currency = tenantSettings?.currency ?? 'USD'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases" className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft size={16} />
          Back to Purchases
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Purchase {purchase.invoice_number ? `#${purchase.invoice_number}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Created on {new Date(purchase.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link 
            href={`/dashboard/purchases/${purchase.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            <Edit size={16} />
            Edit Purchase
          </Link>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(Number(purchase.total_amount), currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-medium">Ingredient</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-right p-4 font-medium">Quantity</th>
                    <th className="text-right p-4 font-medium">Unit Price</th>
                    <th className="text-right p-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.purchase_items?.map((item: PurchaseItemWithDetails) => (
                    <tr key={item.id} className="border-t hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{item.ingredients?.name}</div>
                        <div className="text-xs text-muted-foreground">{item.ingredients?.unit}</div>
                      </td>
                      <td className="p-4 text-sm">{item.locations?.name}</td>
                      <td className="p-4 text-right">{Number(item.quantity)}</td>
                      <td className="p-4 text-right">
                        {formatCurrency(Number(item.unit_price), currency)}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(Number(item.quantity) * Number(item.unit_price), currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">Notes</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{purchase.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Details Card */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">Details</h2>
            
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Supplier</div>
                <div className="text-muted-foreground">{purchase.suppliers?.name || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Invoice Number</div>
                <div className="text-muted-foreground">{purchase.invoice_number || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Invoice Date</div>
                <div className="text-muted-foreground">
                  {new Date(purchase.invoice_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              Attachments
            </h2>
            
            {purchase.purchase_attachments && purchase.purchase_attachments.length > 0 ? (
              <div className="space-y-3">
                {purchase.purchase_attachments.map((file: PurchaseAttachment) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-md group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm truncate" title={file.file_name}>
                        {file.file_name}
                      </span>
                    </div>
                    <a 
                      href={file.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
