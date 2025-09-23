import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Attempt login
    const { token, user } = await AuthService.login({
      email: body.email,
      password: body.password
    })

    // Set authentication cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user
    }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    }, { status: 401 })
  }
}

export async function GET() {
  try {
    // Get current user
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user
    }, { status: 200 })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve user'
    }, { status: 500 })
  }
}
