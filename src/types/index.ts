export type UserRole = "admin" | "developer"

export type StatusCategory = 'not-started' | 'in-progress' | 'completed'

export type TaskStatusObject = {
  id: string;
  name: string;
  color: string;
  category: StatusCategory;
  order: number;
  projectId?: string; // Allow status to be project-specific
}

export type CreateStatusDTO = Omit<TaskStatusObject, 'id' | 'order'> & {
  id?: string;
}

export interface StatusManagementService {
  createStatus(status: CreateStatusDTO): Promise<TaskStatusObject>;
  updateStatus(id: string, status: Partial<CreateStatusDTO>): Promise<TaskStatusObject>;
  deleteStatus(id: string): Promise<void>;
  getStatusesByProject(projectId: string): Promise<TaskStatusObject[]>;
  getDefaultStatuses(): TaskStatusObject[];
}

export type TaskStatusString = "todo" | "in_progress" | "done"

export type TaskStatus = TaskStatusObject | TaskStatusString

export function processTaskStatus(status: TaskStatus): {
  name: string;
  category: 'not-started' | 'in-progress' | 'completed';
  color?: string;
} {
  // If it's already an object, return its properties
  if (typeof status === 'object' && status !== null && 'name' in status) {
    return {
      name: status.name,
      category: status.category,
      color: status.color
    };
  }

  // Handle string-based statuses
  switch(status) {
    case "todo": 
      return { 
        name: "To Do", 
        category: "not-started",
        color: "#FF6B6B"
      };
    case "in_progress": 
      return { 
        name: "In Progress", 
        category: "in-progress",
        color: "#4ECDC4"
      };
    case "done": 
      return { 
        name: "Done", 
        category: "completed",
        color: "#45B7D1"
      };
    default: 
      return { 
        name: String(status), 
        category: "not-started" 
      };
  }
}

// Utility function to get badge variant
export function getStatusBadgeVariant(status: TaskStatus): "default" | "secondary" | "outline" {
  const processedStatus = processTaskStatus(status);
  
  switch(processedStatus.category) {
    case "completed": return "default";
    case "in-progress": return "secondary";
    default: return "outline";
  }
}

export type TaskWithSubtasks = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  subtasks?: TaskWithSubtasks[];
  parentTaskId?: string;
}

export type TaskPriority = "low" | "medium" | "high" | "critical"

export interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  title: string
  description: string | null
  projectName?: string
  projectDocument?: string
  ownerId: string
  owner: User
  members: User[]
  tasks: Task[]
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  projectId: string
  userId: string | null
  createdBy: string | null
  completedAt: Date | null
  assignedTo: string | null
  status: TaskStatus
  label: string | null
  dueDate: Date | null
  endDate: Date | null
  attachments: string | null
  project: Project
  assignee: User | null
  logs: TaskLog[]
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
}

export interface TaskLog {
  id: string
  taskId: string
  task: Task
  userId: string
  user: User
  hoursSpent: number
  description: string | null
  logDate: Date
  createdAt: Date
}

export interface Comment {
  id: string
  taskId: string
  task: Task
  userId: string
  user: User
  content: string
  parentId: string | null
  parent: Comment | null
  replies: Comment[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateTaskData {
  projectId: string
  title: string
  description?: string
  assignedTo?: string
  status?: TaskStatus
  label?: string
  dueDate?: Date
  endDate?: Date
  attachments?: string
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: TaskStatus
}

export interface CreateProjectData {
  title: string
  description?: string
  projectName?: string
  projectDocument?: string
  memberIds?: string[]
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}
