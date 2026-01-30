import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip NEXT internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return
  }

  // Build the default Supabase storage key prefix (sb-<host-prefix>-auth-token)
  const host = (req.headers.get('host') || '').split(':')[0]
  const hostPrefix = host.split('.')[0] || host
  const cookieName = `sb-${hostPrefix}-auth-token`

  const cookie = req.cookies.get(cookieName)?.value
  let loggedIn = false

  if (cookie) {
    try {
      const parsed = JSON.parse(cookie)
      if (
        parsed?.access_token ||
        parsed?.currentSession?.access_token ||
        parsed?.provider_token
      ) {
        loggedIn = true
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // If user hits /login but is already logged in, send to dashboard ✅
  if (pathname === '/login') {
    if (loggedIn) return NextResponse.redirect(new URL('/dashboard', req.url))
    return
  }

  // Protect dashboard: if not logged in, redirect to /login ⚠️
  if (pathname.startsWith('/dashboard')) {
    if (!loggedIn) return NextResponse.redirect(new URL('/login', req.url))
    return
  }

  // Root: decide destination based on auth
  if (pathname === '/') {
    if (loggedIn) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}
