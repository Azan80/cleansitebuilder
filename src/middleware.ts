import { updateSession } from '@/utils/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update session and get user
  const { user, response } = await updateSession(request)

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/builder')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Auth routes (redirect to builder if already logged in)
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
    if (user) {
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
