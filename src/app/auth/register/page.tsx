"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'

// Validation schema
const SignUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type SignUpFormData = z.infer<typeof SignUpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { 
    register, 
    handleSubmit, 
    setError,
    watch,
    formState: { errors, isValid } 
  } = useForm<SignUpFormData>({
    resolver: zodResolver(SignUpSchema),
    mode: 'onChange'
  })

  // Debug: Watch form values
  const watchedValues = watch()
  console.log('Current form values:', watchedValues)
  console.log('Form errors:', errors)
  console.log('Form is valid:', isValid)

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    setServerError(null)
    
    // Debug: Log form data
    console.log('Form data submitted:', data)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Registration successful')
        // Use window.location for a full page reload to ensure cookies are set
        window.location.href = '/dashboard'
      } else {
        // Handle server-side validation errors
        if (result.errors) {
          result.errors.forEach((error: { path: string, message: string }) => {
            // Map server errors to form fields
            const path = error.path === 'name' ? 'name' :
                         error.path === 'email' ? 'email' :
                         error.path === 'password' ? 'password' : 
                         'confirmPassword'
            
            setError(path, {
              type: 'manual',
              message: error.message
            })
          })
        }

        // Set a general server error message
        setServerError(result.message || 'Registration failed')
        
        // Show toast for overall error
        toast.error(result.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setServerError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Sign Up</h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        {serverError && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-lg text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
              disabled={isLoading}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              disabled={isLoading}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password"
              placeholder="Create a strong password"
              {...register('password')}
              disabled={isLoading}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-destructive text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              {...register('confirmPassword')}
              disabled={isLoading}
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/auth/signin" 
              className="text-primary hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
