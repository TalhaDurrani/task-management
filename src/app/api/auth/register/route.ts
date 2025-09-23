import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { cookies } from 'next/headers'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Log incoming request body for debugging
    console.log('Registration Request Body:', body)
    
    // Register user
    const user = await AuthService.register({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || 'USER'
    })

    // Perform login to get token
    const { token } = await AuthService.login({
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
      message: 'User registered successfully',
      user
    }, { status: 201 })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    // Handle specific error types
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 400 })
  }
}
