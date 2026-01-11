import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const email = process.env.SUPERADMIN_EMAIL || 'system@internal.admin'
const password = process.env.SUPERADMIN_PASSWORD || process.env.NEXT_PUBLIC_SUPERADMIN_PASSWORD

if (!password) {
  throw new Error('Missing SUPERADMIN_PASSWORD (or NEXT_PUBLIC_SUPERADMIN_PASSWORD)')
}

const fullName = process.env.SUPERADMIN_FULL_NAME || 'System Super Admin'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function ensureSuperadmin() {
  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'superadmin',
        superadmin: true,
        tenant_id: null,
        status: 'active',
      },
    },
  })

  if (signUpResult.error) {
    const message = signUpResult.error.message || ''
    const alreadyExists = /already registered|user already registered|already exists/i.test(message)
    if (!alreadyExists) {
      throw signUpResult.error
    }

    const signInResult = await supabase.auth.signInWithPassword({ email, password })
    if (signInResult.error) {
      throw signInResult.error
    }

    const updateResult = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        role: 'superadmin',
        superadmin: true,
        tenant_id: null,
        status: 'active',
      },
    })

    if (updateResult.error) {
      throw updateResult.error
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('No authenticated user after seed')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role, tenant_id, status')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError
  if (!profile) throw new Error('Missing public.users profile for seeded superadmin')
  if (profile.role !== 'superadmin') {
    throw new Error(`Seeded user exists but role is '${profile.role}', expected 'superadmin'`)
  }

  console.log(`Seeded superadmin: ${profile.email}`)
}

await ensureSuperadmin()
