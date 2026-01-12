'use server'

import { createClient } from '@supabase/supabase-js'
import { createAdminClient as createServerClient } from '@/lib/supabase/server'

export async function impersonateUser(userId: string) {
  try {
    // 1. Verify current user is superadmin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    // We need to check if user is superadmin.
    // We can use the RPC `is_superadmin` or check the table.
    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('is_superadmin')
    
    if (rpcError || !isSuperAdmin) {
      throw new Error('Access denied: Superadmin only')
    }

    // 2. Create admin client to generate link
    // Note: We need SERVICE_ROLE_KEY for this.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      throw new Error('Server misconfiguration: Missing service role key')
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Get the user's email (needed for generateLink)
    const { data: targetUser, error: userError } = await adminClient.auth.admin.getUserById(userId)
    
    if (userError || !targetUser.user) {
      throw new Error('Target user not found')
    }

    if (!targetUser.user.email) {
      throw new Error('Target user has no email')
    }

    // 4. Generate magic link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
      }
    })

    if (linkError) {
      throw new Error(`Failed to generate link: ${linkError.message}`)
    }

    if (!linkData.properties?.action_link) {
      throw new Error('Failed to generate action link')
    }

    return { success: true, url: linkData.properties.action_link }
  } catch (error) {
    console.error('Impersonation error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
