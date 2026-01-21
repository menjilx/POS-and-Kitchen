'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/client'
import { Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const checkIfSuperAdmin = useCallback(async () => {
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser()
    if (!user) return

    const { data } = await supabaseAdmin.rpc('is_superadmin')

    if (data === true) {
      router.push('/admin')
    }
  }, [router])

  useEffect(() => {
    checkIfSuperAdmin()
  }, [checkIfSuperAdmin])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const { data: isAdmin } = await supabaseAdmin.rpc('is_superadmin')
        
        if (!isAdmin) {
          await supabaseAdmin.auth.signOut()
          throw new Error('Access denied: Superadmin privileges required')
        }

        const { error: lastLoginError } = await supabaseAdmin.rpc('update_last_login')
        if (lastLoginError) {
          console.error('Failed to update last login:', lastLoginError)
        }

        toast({
          title: "Welcome back",
          description: "Logged in as Super Admin",
        })
        router.push('/admin')
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: err instanceof Error ? err.message : 'Login failed',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border border-red-200">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-600">Super Admin</h1>
          <p className="mt-2 text-muted-foreground">System administration access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="stratbithq@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access Super Admin'}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            ← Back to regular login
          </Link>
        </div>
      </div>
    </div>
  )
}
