import { v4 as uuidv4 } from 'uuid'
import { TaskStatusObject, CreateStatusDTO, StatusManagementService } from '@/types'

// Predefined color palette
const STATUS_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F3B562', // Warm Yellow
  '#A569BD', // Purple
]

export class MockStatusService implements StatusManagementService {
  private statuses: TaskStatusObject[] = []

  constructor() {
    this.statuses = this.getDefaultStatuses()
  }

  getDefaultStatuses(): TaskStatusObject[] {
    return [
      {
        id: 'status-todo',
        name: 'To Do',
        color: '#FF6B6B',
        category: 'not-started',
        order: 1
      },
      {
        id: 'status-in-progress',
        name: 'In Progress',
        color: '#4ECDC4',
        category: 'in-progress',
        order: 2
      },
      {
        id: 'status-done',
        name: 'Done',
        color: '#45B7D1',
        category: 'completed',
        order: 3
      }
    ]
  }

  async createStatus(statusData: CreateStatusDTO): Promise<TaskStatusObject> {
    const newStatus: TaskStatusObject = {
      id: statusData.id || uuidv4(),
      name: statusData.name,
      color: statusData.color || this.getUniqueColor(),
      category: statusData.category,
      order: this.statuses.length + 1,
      projectId: statusData.projectId
    }

    this.statuses.push(newStatus)
    return newStatus
  }

  async updateStatus(id: string, updates: Partial<CreateStatusDTO>): Promise<TaskStatusObject> {
    const statusIndex = this.statuses.findIndex(s => s.id === id)
    if (statusIndex === -1) {
      throw new Error('Status not found')
    }

    this.statuses[statusIndex] = {
      ...this.statuses[statusIndex],
      ...updates
    }

    return this.statuses[statusIndex]
  }

  async deleteStatus(id: string): Promise<void> {
    this.statuses = this.statuses.filter(s => s.id !== id)
  }

  async getStatusesByProject(projectId: string): Promise<TaskStatusObject[]> {
    return this.statuses.filter(s => s.projectId === projectId)
  }

  private getUniqueColor(): string {
    const usedColors = new Set(this.statuses.map(s => s.color))
    const availableColors = STATUS_COLORS.filter(color => !usedColors.has(color))
    
    return availableColors.length > 0 
      ? availableColors[0] 
      : STATUS_COLORS[Math.floor(Math.random() * STATUS_COLORS.length)]
  }
}

export const statusService = new MockStatusService()

