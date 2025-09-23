import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Clear authentication cookie
    cookies().delete('auth_token')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      message: 'Logout failed'
    }, { status: 500 })
  }
}
