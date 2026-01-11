'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export default function EditMenuCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadCategory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          name: data.name,
          description: data.description || '',
        })
      }
    } catch (err) {
      console.error('Error loading category:', err)
      setError('Failed to load category')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCategory()
  }, [loadCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({
          name: formData.name,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Category updated successfully')
      router.push('/dashboard/menu/categories')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update category'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Category deleted successfully')
      router.push('/dashboard/menu/categories')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category'
      setError(msg)
      toast.error(msg)
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu/categories" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Menu Category</h1>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Category Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Appetizers"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-50"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
