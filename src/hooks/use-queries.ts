import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query Keys
export const queryKeys = {
  projects: ['projects'],
  project: (id: string) => ['project', id],
  tasks: (projectId?: string) => projectId ? ['tasks', projectId] : ['tasks'],
  task: (id: string) => ['task', id],
  users: ['users'],
  user: (id: string) => ['user', id],
  activities: ['activities'],
}

// Projects
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create project')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

// Tasks
export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.tasks(projectId),
    queryFn: async () => {
      const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${id}`)
      if (!response.ok) throw new Error('Failed to fetch task')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create task')
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update task')
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
    },
  })
}

// Users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
  })
}

// Activities
export function useActivities() {
  return useQuery({
    queryKey: queryKeys.activities,
    queryFn: async () => {
      const response = await fetch('/api/activities')
      if (!response.ok) throw new Error('Failed to fetch activities')
      return response.json()
    },
  })
}
