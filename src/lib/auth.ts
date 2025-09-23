import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables')
}

// Validation schemas
const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
})

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
})

export class AuthService {
  // Use a method to get the JWT secret to ensure it's always available
  private static getJwtSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is not defined')
    }
    return secret
  }

  // User registration
  static async register(data: {
    name: string, 
    email: string, 
    password: string,
    role?: 'USER' | 'ADMIN'
  }) {
    try {
      // Validate input
      const validatedData = RegisterSchema.parse(data)

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: data.role || 'USER'
        }
      })

      return { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // User login
  static async login(credentials: { email: string, password: string }) {
    try {
      // Validate input
      const validatedData = LoginSchema.parse(credentials)

      // Find user with organization and workspace data
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (!user) {
        throw new Error('Invalid credentials')
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(
        validatedData.password, 
        user.password
      )

      if (!isPasswordValid) {
        throw new Error('Invalid credentials')
      }

      // Generate JWT token using jose (Edge Runtime compatible)
      const secret = new TextEncoder().encode(this.getJwtSecret())
      const token = await new SignJWT({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(secret)

      return { 
        token,
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          organizationId: user.organizationId,
          workspaceId: user.workspaceId,
          organization: user.organization,
          workspace: user.workspace
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Verify JWT token (Edge Runtime compatible)
  static async verifyToken(token: string) {
    try {
      // Use jose for Edge Runtime compatibility
      const secret = new TextEncoder().encode(this.getJwtSecret())
      const { payload } = await jwtVerify(token, secret)
      
      return payload as { 
        id: string, 
        email: string, 
        role: 'USER' | 'ADMIN' 
      }
    } catch (error) {
      return null
    }
  }

  // Get current user
  static async getCurrentUser() {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null

    const decoded = await this.verifyToken(token)
    if (!decoded) return null

    return await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        workspaceId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // Logout (clear token)
  static logout() {
    const cookieStore = cookies()
    cookieStore.delete('auth_token')
  }
}
