'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function archiveCategory(categoryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('ingredient_categories')
    .update({ status: 'archived' })
    .eq('id', categoryId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/ingredient-categories')
}

export async function restoreCategory(categoryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'owner' && userData.role !== 'manager')) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('ingredient_categories')
    .update({ status: 'active' })
    .eq('id', categoryId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/ingredient-categories')
}
