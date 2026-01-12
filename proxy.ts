import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function createClient(request: NextRequest, cookieName?: string) {
  let cookiesToSet: Parameters<NextResponse['cookies']['set']>[] = []

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: cookieName,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(newCookies) {
          cookiesToSet = newCookies.map(({ name, value, options }) => [name, value, options])
        },
      },
    }
  )

  const applyCookies = (response: NextResponse) => {
    cookiesToSet.forEach((args) => response.cookies.set(...args))
    return response
  }

  return { client, applyCookies }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path === "/@vite/client" || path.startsWith("/@vite/")) {
    return new NextResponse("/* noop */\n", {
      status: 200,
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  }

  // Handle Admin Routes with Admin Client
  if (path.startsWith('/admin')) {
    const { client: supabaseAdmin, applyCookies } = createClient(request, 'sb-superadmin-token')
    const { data: { session } } = await supabaseAdmin.auth.getSession()

    if (path === '/admin/login') {
      if (session) {
        const { data: isSuperAdmin } = await supabaseAdmin.rpc('is_superadmin')
        if (isSuperAdmin === true) {
          return applyCookies(NextResponse.redirect(new URL('/admin', request.url)))
        }
      }
      return applyCookies(NextResponse.next())
    }

    // Protected Admin Routes
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirectTo', path)
      return applyCookies(NextResponse.redirect(loginUrl))
    }

    const { data: isSuperAdmin } = await supabaseAdmin.rpc('is_superadmin')

    if (isSuperAdmin !== true) {
      const loginUrl = new URL('/admin/login', request.url)
      return applyCookies(NextResponse.redirect(loginUrl))
    }

    return applyCookies(NextResponse.next())
  }

  // Handle Standard Routes with Default Client
  const { client: supabase, applyCookies } = createClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  if (path === '/login' || path === '/signup' || path === '/auth/callback') {
    if (session && (path === '/login' || path === '/signup')) {
      return applyCookies(NextResponse.redirect(new URL('/dashboard', request.url)))
    }
    return applyCookies(NextResponse.next())
  }

  if (path.startsWith('/dashboard') || path.startsWith('/kds')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return applyCookies(NextResponse.redirect(loginUrl))
    }
  }

  return applyCookies(NextResponse.next())
}

export const matcher = [
  '/((?!api|_next/static|_next/image|favicon.ico).*)',
]
