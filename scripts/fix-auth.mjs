import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const invalidEmail = 'system@internal.admin'
const validEmail = 'admin@kitchensystem.com'

async function cleanup() {
  console.log('Starting cleanup...')

  // 1. Remove invalid user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const invalidUser = users.find(u => u.email === invalidEmail)
  if (invalidUser) {
    console.log(`Deleting invalid user: ${invalidUser.id}`)
    const { error: delError } = await supabase.auth.admin.deleteUser(invalidUser.id)
    if (delError) console.error('Error deleting user:', delError)
    else console.log('Invalid user deleted')
  } else {
    console.log('Invalid user not found')
  }

  // 2. Fix valid user
  const validUser = users.find(u => u.email === validEmail)
  if (validUser) {
    console.log(`Fixing valid user: ${validUser.id}`)
    
    // Confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      validUser.id, 
      { email_confirm: true }
    )
    if (updateError) console.error('Error confirming email:', updateError)
    else console.log('Email confirmed')

    // Ensure public profile exists and is superadmin
    // (This part usually requires querying public table, which service role can do)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', validUser.id)
      .single()

    if (profileError) throw profileError
    
    if (profile) {
        if (profile.role !== 'superadmin') {
             await supabase.from('users').update({ role: 'superadmin' }).eq('id', validUser.id)
             console.log('Role updated to superadmin')
        }
    } else {
        // Insert if missing
        await supabase.from('users').insert({
            id: validUser.id,
            email: validEmail,
            full_name: 'System Super Admin',
            role: 'superadmin',
            tenant_id: null,
            status: 'active'
        })
        console.log('Public profile created')
    }

  } else {
    console.log('Valid user not found. Please run the seed script again.')
  }
}

cleanup().catch(console.error)
