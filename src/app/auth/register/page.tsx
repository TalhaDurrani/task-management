"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    toast.info('User registration is disabled. Please contact your administrator to create an account.')
    router.push('/auth/signin')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">Registration Disabled</h1>
        <p className="text-muted-foreground">
          User registration is currently disabled. Please contact your administrator to create an account.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to sign in page...
        </p>
      </div>
    </div>
  )
}
