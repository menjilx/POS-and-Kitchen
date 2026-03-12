'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Helper to check permissions
async function checkOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'owner') {
    throw new Error('Unauthorized')
  }
  return { supabase, currentUser }
}

export async function updateUser(formData: FormData) {
  try {
    const { supabase, currentUser } = await checkOwner()

    const userId = formData.get('userId') as string
    const role = formData.get('role') as string
    const status = formData.get('status') as string

    if (!userId) throw new Error('User ID is required')

    // Prevent changing own role/status to something locking
    if (userId === currentUser.id && (role !== 'owner' || status !== 'active')) {
      throw new Error('Cannot change your own role or status')
    }

    const { error } = await supabase
      .from('users')
      .update({ role, status })
      .eq('id', userId)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to update user' }
  }
}

export async function inviteUser(formData: FormData) {
  try {
    const { currentUser } = await checkOwner()

    const email = formData.get('email') as string
    const role = formData.get('role') as string

    if (!email || !role) throw new Error('Email and Role are required')

    // Use Service Role for admin Invite
    // Note: This requires process.env.SUPABASE_SERVICE_ROLE_KEY to be set
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteUrl,
      data: {
        role: role,
        full_name: '', // Optional
      }
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to invite user' }
  }
}

export async function deleteUser(userId: string) {
    try {
        const { currentUser } = await checkOwner()
        
        if (userId === currentUser.id) {
            throw new Error('Cannot delete your own account')
        }

        // Instead of hard delete, maybe just ensure they are deactivated?
        // But if we want to delete:
        // Supabase Auth deletion requires Admin client.
        
         const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Delete from Auth (cascades to public.users usually if set up, or we delete manually)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        
        if (error) throw new Error(error.message)
        
        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to delete user' }
    }
}
