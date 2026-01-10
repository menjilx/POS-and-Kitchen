'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Shield, CheckCircle } from 'lucide-react'

export default function SuperadminSignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    secretCode: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSecretValid, setIsSecretValid] = useState(false)

  const checkSecretCode = async (code: string) => {
    if (!code) {
      setIsSecretValid(false)
      return
    }
    
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'KITCHEN-SUPERADMIN-2024')
        .single()
      
      if (data?.value === code) {
        setIsSecretValid(true)
      } else {
        setIsSecretValid(false)
      }
    } catch (e) {
      console.error('Failed to check secret:', e)
      setIsSecretValid(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSecretCode(formData.secretCode)
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.secretCode])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!isSecretValid) {
      setError('Invalid secret code')
      setLoading(false)
      return
    }

    try {
      // 1. Create auth user with superadmin role and NO tenant_id (global admin)
      // The trigger will automatically create the public user profile with tenant_id = NULL
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'superadmin',
            superadmin: true,
            tenant_id: null, // Global superadmin has no tenant
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
         if (authData.session === null && !authData.user) {
            throw new Error('Signup successful but requires email verification. Please check your logs/inbox.')
         }
      }
      
      router.push('/admin/login?message=Account+created+successfully')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err?.message || 'Signup failed')
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
          <h1 className="text-3xl font-bold text-red-600">Super Admin Signup</h1>
          <p className="mt-2 text-muted-foreground">Create system administrator account</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="secretCode" className="block text-sm font-medium mb-2">
              Secret Code
            </label>
            <div className="relative">
              <input
                id="secretCode"
                type="text"
                required
                value={formData.secretCode}
                onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
                className="w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter secret code"
              />
              {isSecretValid ? (
                <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-600" />
              ) : (
                <div className="absolute right-3 top-3 w-6 h-6 text-gray-400" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contact system administrator for secret code
            </p>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Super Admin Name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@yourcompany.com"
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Create a strong password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isSecretValid}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Super Admin'}
          </button>
        </form>

        <div className="text-center">
          <a href="/admin/login" className="text-muted-foreground hover:text-foreground text-sm">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
