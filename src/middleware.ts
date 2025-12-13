import { updateSession } from '@/utils/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update session and get user
  const { user, response } = await updateSession(request)

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/builder')) {
    if (!user) {
      // Preserve the full URL including query params for redirect back after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Check if user is on /builder (list page) with a prompt parameter
    // This happens after OAuth login - redirect to home to trigger project creation
    if (request.nextUrl.pathname === '/builder') {
      const prompt = request.nextUrl.searchParams.get('prompt')
      if (prompt) {
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('auto_create', 'true')
        redirectUrl.searchParams.set('prompt', prompt)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Auth routes (redirect to builder if already logged in)
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
    if (user) {
      // Check if there's a prompt parameter
      const prompt = request.nextUrl.searchParams.get('prompt')
      if (prompt) {
        // Redirect to root with prompt, let client-side handle project creation
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('auto_create', 'true')
        redirectUrl.searchParams.set('prompt', prompt)
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.redirect(new URL('/builder', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
