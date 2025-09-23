"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/login', { 
          method: 'GET',
          credentials: 'include'
        })
        const result = await response.json()
        
        if (result.success && result.user) {
          setUser(result.user)
        } else {
          setUser(null)
          // Only redirect if we're not already on an auth page
          if (!window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/signin'
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
        // Only redirect if we're not already on an auth page
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/signin'
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  }
}

