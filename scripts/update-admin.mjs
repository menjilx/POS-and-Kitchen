import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Required environment variables are missing.')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const emailsToDelete = [
    'system@internal.admin',
    'admin@kitchensystem.com'
]

const newSuperAdmin = {
    email: 'stratbithq@gmail.com',
    password: process.env.SUPERADMIN_PASSWORD || process.env.NEXT_PUBLIC_SUPERADMIN_PASSWORD || 'password123',
    full_name: 'Stratbit HQ'
}

async function updateSuperAdmin() {
    console.log(`Connecting to Supabase at ${supabaseUrl}...`)
    
    // 1. Delete old users
    console.log('Cleaning up old users...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
        console.error('Failed to list users:', listError.message)
        // If connection fails, it will likely fail here
        return
    }

    for (const email of emailsToDelete) {
        const user = users.find(u => u.email === email)
        if (user) {
            const { error } = await supabase.auth.admin.deleteUser(user.id)
            if (error) console.error(`Failed to delete ${email}:`, error.message)
            else console.log(`Deleted user: ${email}`)
            
            // Try to cleanup public profile just in case trigger didn't catch it
            await supabase.from('users').delete().eq('id', user.id)
        }
    }

    // 2. Create or Update New User
    console.log(`Setting up superadmin: ${newSuperAdmin.email}`)
    const existingUser = users.find(u => u.email === newSuperAdmin.email)
    let userId

    if (existingUser) {
        console.log('User exists. Updating...')
        const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: newSuperAdmin.password,
            email_confirm: true,
            user_metadata: {
                full_name: newSuperAdmin.full_name,
                role: 'superadmin',
                superadmin: true,
                tenant_id: null,
                status: 'active'
            }
        })
        if (error) throw error
        userId = existingUser.id
        console.log('Auth profile updated.')
    } else {
        console.log('User does not exist. Creating...')
        const { data, error } = await supabase.auth.admin.createUser({
            email: newSuperAdmin.email,
            password: newSuperAdmin.password,
            email_confirm: true,
            user_metadata: {
                full_name: newSuperAdmin.full_name,
                role: 'superadmin',
                superadmin: true,
                tenant_id: null,
                status: 'active'
            }
        })
        if (error) throw error
        userId = data.user.id
        console.log('Auth profile created.')
    }

    // 3. Ensure Public Profile
    console.log('Ensuring public user profile...')
    const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single()
    
    if (profile) {
        if (profile.role !== 'superadmin') {
            await supabase.from('users').update({ 
                role: 'superadmin',
                full_name: newSuperAdmin.full_name,
                tenant_id: null
            }).eq('id', userId)
            console.log('Public profile role updated to superadmin.')
        } else {
            console.log('Public profile is already correct.')
        }
    } else {
        await supabase.from('users').insert({
            id: userId,
            email: newSuperAdmin.email,
            full_name: newSuperAdmin.full_name,
            role: 'superadmin',
            tenant_id: null,
            status: 'active'
        })
        console.log('Public profile created.')
    }
    
    console.log('\nSUCCESS! You can now login with:')
    console.log(`Email: ${newSuperAdmin.email}`)
    console.log(`Password: ${newSuperAdmin.password}`)
}

updateSuperAdmin().catch(console.error)
