"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function fixProfile(userId: string, email: string) {
  const supabase = await createClient()
  
  // Create a recovery tenant
  const { data: newTenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Recovery Tenant',
      email: email
    })
    .select()
    .single()
    
  if (tenantError) {
    console.error("Failed to create recovery tenant:", tenantError)
    return { error: "Failed to create recovery tenant. " + tenantError.message }
  }
  
  // Insert the user
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      tenant_id: newTenant.id,
      email: email,
      full_name: 'Recovered User',
      role: 'owner',
      status: 'active'
    })
    
  if (insertError) {
    return { error: "Failed to insert user profile. " + insertError.message }
  }
  
  // If successful, we don't return, we redirect to refresh the layout
  redirect('/dashboard')
}
