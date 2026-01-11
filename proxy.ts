import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function proxy(request: NextRequest) {
  const supabase = await createClient()
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

  const { data: { session } } = await supabase.auth.getSession()

  if (path === '/admin/login') {
    if (session) {
      const { data: isSuperAdmin } = await supabase.rpc('is_superadmin')
      if (isSuperAdmin === true) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    return NextResponse.next()
  }

  if (path.startsWith('/admin') && path !== '/admin/login') {
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(loginUrl)
    }

    const { data: isSuperAdmin } = await supabase.rpc('is_superadmin')

    if (isSuperAdmin !== true) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  if (path === '/login' || path === '/signup' || path === '/auth/callback') {
    if (session && (path === '/login' || path === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (path.startsWith('/dashboard') || path.startsWith('/kds')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const matcher = [
  '/((?!api|_next/static|_next/image|favicon.ico).*)',
]
