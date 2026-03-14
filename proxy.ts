import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const getResponse = () => supabaseResponse

  return { client, getResponse }
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

  // Handle Standard Routes with Default Client
  const { client: supabase, getResponse } = createClient(request)

  // IMPORTANT: Use getUser() instead of getSession() so the token
  // is validated server-side and refreshed cookies are written back.
  const { data: { user } } = await supabase.auth.getUser()

  if (path === '/login' || path === '/signup' || path === '/auth/callback') {
    if (user && (path === '/login' || path === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return getResponse()
  }

  if (path.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return getResponse()
}

export const matcher = [
  '/((?!api|_next/static|_next/image|favicon.ico).*)',
]
