'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { ExpenseCategory } from '@/types/database'
import { useAppSettings } from '@/hooks/use-app-settings'

type ExpenseFormData = {
  category_id: string
  description: string
  amount: string
  expense_date: string
  notes: string
}

const defaultExpenseDate = new Date().toISOString().split('T')[0]

export default function NewExpensePage() {
  const router = useRouter()
  const { currencySymbol } = useAppSettings()
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    category_id: '',
    description: '',
    amount: '',
    expense_date: defaultExpenseDate,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<ExpenseCategory[]>([])

  const loadCategories = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name')

    setCategories(((data ?? []) as unknown) as ExpenseCategory[])
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCategories()
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [loadCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('expenses').insert({
        category_id: formData.category_id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        notes: formData.notes,
        created_by: user.id,
      })

      if (error) throw error

      router.push('/dashboard/expenses')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/expenses" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">New Expense</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <input
              id="description"
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Monthly rent, utilities"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-2">
                Amount ({currencySymbol})
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="expense_date" className="block text-sm font-medium mb-2">
                Date
              </label>
              <input
                id="expense_date"
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
              placeholder="Any additional notes..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Expense'}
          </button>
        </form>
      </div>
    </div>
  )
}
