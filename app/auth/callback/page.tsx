'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        router.push('/login?error=' + encodeURIComponent(error.message))
        return
      }

      if (data.session) {
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
        router.push(redirectUrl || '/dashboard')
      } else {
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  )
}
