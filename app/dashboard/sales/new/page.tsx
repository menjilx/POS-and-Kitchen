'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

export default function NewSalePage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    sale_type: 'dine_in',
    table_id: '',
    reservation_id: '',
    payment_method: 'cash',
    tip_amount: '0',
    notes: '',
  })
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [tables, setTables] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (userData) {
      const [menuRes, tablesRes] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('tables')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .in('status', ['available', 'reserved'])
          .order('table_number'),
      ])

      setMenuItems(menuRes.data || [])
      setTables(tablesRes.data || [])
    }
  }

  const addSaleItem = () => {
    if (menuItems.length === 0) return
    setSaleItems([
      ...saleItems,
      {
        menu_item_id: menuItems[0].id,
        quantity: 1,
        unit_price: Number(menuItems[0].selling_price),
        menu_item_name: menuItems[0].name,
      },
    ])
  }

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const updateSaleItem = (index: number, field: string, value: any) => {
    const updated = [...saleItems]
    if (field === 'menu_item_id') {
      const menuItem = menuItems.find(i => i.id === value)
      updated[index] = {
        ...updated[index],
        [field]: value,
        unit_price: menuItem ? Number(menuItem.selling_price) : 0,
        menu_item_name: menuItem?.name || '',
      }
    } else if (field === 'quantity') {
      updated[index] = { ...updated[index], [field]: Number(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setSaleItems(updated)
  }

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const tip = Number(formData.tip_amount) || 0
    const total = subtotal + tip
    return { subtotal, tip, total }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (saleItems.length === 0) {
      setError('Please add at least one item')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          tenant_id: userData.tenant_id,
          order_number: `ORD-${Date.now()}`,
          sale_type: formData.sale_type as any,
          table_id: formData.table_id || null,
          reservation_id: formData.reservation_id || null,
          total_amount: totals.total,
          payment_method: formData.payment_method as any,
          payment_status: 'paid',
          tip_amount: totals.tip,
          payment_data: { method: formData.payment_method },
          notes: formData.notes,
          created_by: user.id,
        })
        .select()
        .single()

      if (!sale) throw new Error('Failed to create sale')

      const saleItemInserts = saleItems.map(item => ({
        sale_id: sale.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemInserts)

      if (itemsError) throw itemsError

      router.push('/dashboard/sales')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/sales" className="text-primary hover:underline">
          ← Back
        </a>
        <h1 className="text-3xl font-bold">New Sale</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Sale Details</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sale_type" className="block text-sm font-medium mb-2">
                    Type
                  </label>
                  <select
                    id="sale_type"
                    value={formData.sale_type}
                    onChange={(e) => setFormData({ ...formData, sale_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="dine_in">Dine In</option>
                    <option value="takeout">Takeout</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="table_id" className="block text-sm font-medium mb-2">
                    Table
                  </label>
                  <select
                    id="table_id"
                    value={formData.table_id}
                    onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select table (optional)</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.table_number} (Capacity: {table.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Items</h2>
              <button
                type="button"
                onClick={addSaleItem}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {saleItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <select
                    value={item.menu_item_id}
                    onChange={(e) => updateSaleItem(index, 'menu_item_id', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {menuItems.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name} - ${Number(menu.selling_price).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value))}
                    className="w-20 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <div className="w-24 text-right py-2">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSaleItem(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {saleItems.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No items added yet. Click "Add Item" to start adding products.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Payment</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium mb-2">
                  Payment Method
                </label>
                <select
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="ewallet">eWallet</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label htmlFor="tip_amount" className="block text-sm font-medium mb-2">
                  Tip Amount ($)
                </label>
                <input
                  id="tip_amount"
                  type="number"
                  step="0.01"
                  value={formData.tip_amount}
                  onChange={(e) => setFormData({ ...formData, tip_amount: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Any special notes..."
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip:</span>
                  <span className="font-medium">${totals.tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || saleItems.length === 0}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
