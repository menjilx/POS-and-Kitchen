import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Required environment variables are missing.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const email = 'stratbithq@gmail.com'
const password = 'admin_secure_password_2024'

async function diagnose() {
  console.log(`Diagnosing login for ${email} on ${supabaseUrl}...`)

  // 1. Try Login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError) {
    console.error('Login FAILED:', signInError.message)
    console.log('Error Details:', JSON.stringify(signInError, null, 2))
    
    // If invalid login, maybe user doesn't exist? Try SignUp
    if (signInError.message.includes('Invalid login') || signInError.message.includes('not found')) {
        console.log('Attempting Sign Up...')
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Stratbit HQ',
                    role: 'superadmin',
                    superadmin: true,
                }
            }
        })
        
        if (signUpError) {
             console.error('Sign Up FAILED:', signUpError.message)
        } else {
             console.log('Sign Up SUCCEEDED.')
             if (signUpData.user && !signUpData.session) {
                 console.log('IMPORTANT: User created but email confirmation is required. Please check your inbox.')
             } else {
                 console.log('User created and logged in.')
             }
        }
    }
    return
  }

  console.log('Login SUCCEEDED!')
  const user = signInData.user
  console.log('User ID:', user.id)
  
  // 2. Check Profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (profileError) {
      console.log('Profile Fetch Error:', profileError.message)
      // Attempt to create profile if missing
      console.log('Attempting to create public profile...')
      const { error: insertError } = await supabase
        .from('users')
        .insert({
            id: user.id,
            email,
            full_name: 'Stratbit HQ',
            role: 'superadmin',
            status: 'active'
        })
       if (insertError) console.error('Profile Creation FAILED:', insertError.message)
       else console.log('Profile Created Successfully.')
  } else {
      console.log('Profile Found:', profile)
      if (profile.role !== 'superadmin') {
          console.log('WARNING: Role is NOT superadmin. It is:', profile.role)
      }
  }
}

diagnose().catch(console.error)
