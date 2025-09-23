import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  // Public routes that don't require authentication
  const publicPaths = [
    '/auth/signin', 
    '/auth/register', 
    '/api/auth/login', 
    '/api/auth/register'
  ]

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // If no token, redirect to login for protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Verify token
  try {
    const decoded = await AuthService.verifyToken(token)
    
    // If token is invalid, redirect to login
    if (!decoded) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Allow access to protected routes
    return NextResponse.next()
  } catch (error) {
    // Token verification failed
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Dashboard routes only - don't protect API routes
    '/dashboard/:path*',
    
    // Root path
    '/',
    
    // Add other protected routes here but exclude API routes
  ]
}
