import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

const adminStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return
    const isProd = process.env.NODE_ENV === 'production'
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; SameSite=Lax; ${isProd ? 'Secure' : ''}; max-age=31536000`
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return
    document.cookie = `${key}=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:01 GMT`
  }
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: adminStorage,
    storageKey: 'sb-superadmin-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }
})
