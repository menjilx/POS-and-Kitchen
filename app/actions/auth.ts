"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function fixProfile(userId: string, email: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    redirect('/login')
  }

  const allowedRoles = new Set(['owner', 'manager', 'staff'])
  const allowedStatuses = new Set(['active', 'deactivated'])

  const meta = user.user_metadata as Record<string, unknown> | null
  const fullName = typeof meta?.full_name === 'string' ? meta.full_name : null
  const role = typeof meta?.role === 'string' && allowedRoles.has(meta.role) ? meta.role : 'owner'
  const status = typeof meta?.status === 'string' && allowedStatuses.has(meta.status) ? meta.status : 'active'
  const resolvedEmail = user.email || email

  if (!resolvedEmail) {
    redirect('/login')
  }

  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        email: resolvedEmail,
        full_name: fullName,
        role,
        status,
      },
      { onConflict: 'id' }
    )

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
