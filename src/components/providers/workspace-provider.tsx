"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface Workspace {
  id: string
  name: string
  description: string | null
  joinCode?: string
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    projects: number
  }
  userRole?: 'ADMIN' | 'MEMBER' // User's role in this workspace
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  setSelectedWorkspace: (workspace: Workspace | null) => void
  isLoading: boolean
  error: string | null
  refreshWorkspaces: () => Promise<void>
  currentUserRole: 'ADMIN' | 'MEMBER' | null // User's role in selected workspace
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// LocalStorage key
const STORAGE_KEY = 'selectedWorkspaceId'

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspaceState] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Current user's role in the selected workspace
  const currentUserRole = selectedWorkspace?.userRole || null

  // Memoized function to load workspaces
  const refreshWorkspaces = useCallback(async () => {
    if (!user || authLoading) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/workspaces')
      
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces')
      }

      const data = await response.json()
      setWorkspaces(data)

      // Auto-select workspace (priority order: saved > primary > first)
      if (data.length > 0) {
        // Try to restore from localStorage
        const savedId = localStorage.getItem(STORAGE_KEY)
        const savedWorkspace = savedId ? data.find((ws: Workspace) => ws.id === savedId) : null
        
        // Try user's primary workspace
        const primaryWorkspace = data.find((ws: Workspace) => ws.id === (user as any).workspaceId)
        
        // Fallback to first workspace
        const workspaceToSelect = savedWorkspace || primaryWorkspace || data[0]
        
        setSelectedWorkspaceState(workspaceToSelect)
      } else {
        setSelectedWorkspaceState(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workspaces'
      setError(message)
      console.error('Error loading workspaces:', err)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [user, authLoading])

  // Initial load
  useEffect(() => {
    refreshWorkspaces()
  }, [refreshWorkspaces])

  // Handle workspace selection with persistence
  const handleSetSelectedWorkspace = useCallback((workspace: Workspace | null) => {
    setSelectedWorkspaceState(workspace)
    
    if (workspace) {
      try {
        localStorage.setItem(STORAGE_KEY, workspace.id)
      } catch (err) {
        console.warn('Failed to save workspace to localStorage:', err)
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (err) {
        console.warn('Failed to remove workspace from localStorage:', err)
      }
    }
  }, [])

  const value: WorkspaceContextType = {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace: handleSetSelectedWorkspace,
    isLoading,
    error,
    refreshWorkspaces,
    currentUserRole,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
