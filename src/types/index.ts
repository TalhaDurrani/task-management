export type UserRole = "admin" | "developer";

export type StatusCategory = "not-started" | "in-progress" | "completed";

export type TaskStatusObject = {
  id: string;
  name: string;
  color: string;
  category: StatusCategory;
  order: number;
  projectId?: string; // Allow status to be project-specific
};

export type CreateStatusDTO = Omit<TaskStatusObject, "id" | "order"> & {
  id?: string;
};

export interface StatusManagementService {
  createStatus(status: CreateStatusDTO): Promise<TaskStatusObject>;
  updateStatus(
    id: string,
    status: Partial<CreateStatusDTO>
  ): Promise<TaskStatusObject>;
  deleteStatus(id: string): Promise<void>;
  getStatusesByProject(projectId: string): Promise<TaskStatusObject[]>;
  getDefaultStatuses(): TaskStatusObject[];
}

export type TaskStatusString = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskStatus = TaskStatusObject | TaskStatusString | number;

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CustomFieldType =
  | "TEXT"
  | "NUMBER"
  | "DROPDOWN"
  | "MULTI_SELECT"
  | "BOOLEAN"
  | "DATE"
  | "USER"
  | "EMAIL"
  | "URL"
  | "TEXTAREA"
  | "CHECKBOX"
  | "RATING";

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  hoursSpent: number;
  description?: string;
  logDate: Date;
  createdAt: Date;
  task?: Task;
  user?: User;
}

export interface Timer {
  id: string;
  taskId: string;
  userId: string;
  description?: string;
  startedAt: Date;
  endedAt?: Date;
  pausedAt?: Date;
  elapsedTime?: number;
  isActive: boolean;
  createdAt: Date;
  task?: Task;
  user?: User;
}
export function processTaskStatus(status: TaskStatus): {
  name: string;
  category: "not-started" | "in-progress" | "completed";
  color?: string;
} {
  // Handle numeric status values first
  if (typeof status === "number") {
    switch (status) {
      case 1:
        return {
          name: "To Do",
          category: "not-started",
          color: "#6B7280",
        };
      case 2:
        return {
          name: "In Progress",
          category: "in-progress",
          color: "#3B82F6",
        };
      case 3:
        return {
          name: "Done",
          category: "completed",
          color: "#10B981",
        };
      default:
        return {
          name: "To Do",
          category: "not-started",
          color: "#6B7280",
        };
    }
  }

  // If it's already an object, return its properties
  if (typeof status === "object" && status !== null && "name" in status) {
    return {
      name: status.name,
      category: status.category,
      color: status.color,
    };
  }

  // Handle string-based statuses
  switch (status) {
    case "TODO":
      return {
        name: "To Do",
        category: "not-started",
        color: "#6B7280",
      };
    case "IN_PROGRESS":
      return {
        name: "In Progress",
        category: "in-progress",
        color: "#3B82F6",
      };
    case "DONE":
      return {
        name: "Done",
        category: "completed",
        color: "#10B981",
      };
    default:
      return {
        name: String(status),
        category: "not-started",
      };
  }
}

export function getStatusBadgeVariant(
  status: TaskStatus
): "default" | "secondary" | "outline" {
  const processedStatus = processTaskStatus(status);

  switch (processedStatus.category) {
    case "completed":
      return "default";
    case "in-progress":
      return "secondary";
    default:
      return "outline";
  }
}

export type TaskWithSubtasks = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  subtasks?: TaskWithSubtasks[];
  parentTaskId?: string;
};

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  projectName?: string;
  projectDocument?: string;
  ownerId: string;
  owner: User;
  members: User[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string;
  completedAt?: Date;
  createdAt: Date;
  project: Project;
  creator: User;
  assignees: User[];
  subTasks: SubTask[];
  comments: Comment[];
  attachments: Attachment[];
  customFields: TaskCustomField[];
  timeLogs: TimeLog[];
  timers: Timer[];
}

export interface SubTask {
  id?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  // Removed status field
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  task?: Task;
  user?: User;
}

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  description?: string;
  options?: string; // JSON array for DROPDOWN, MULTI_SELECT, CHECKBOX options
  defaultValue?: string;
  placeholder?: string;
  isRequired: boolean;
  isGlobal: boolean; // Global = available across all projects
  min?: number; // For NUMBER, RATING validation
  max?: number; // For NUMBER, RATING validation
  pattern?: string; // Regex pattern for TEXT, EMAIL, URL validation
  workspaceId?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  workspace?: Workspace;
  project?: Project;
  taskValues: TaskCustomField[];
}

export interface TaskCustomField {
  id: string;
  taskId: string;
  customFieldId: string;
  value?: string;
  task?: Task;
  customField?: CustomField;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  users: User[];
  projects: Project[];
  customFields: CustomField[];
  taskTemplates?: TaskTemplate[];
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  priority: TaskPriority;
  workspaceId: string;
  projectId?: string;
  templateData: string; // JSON with default values, custom fields, etc.
  createdAt: Date;
  updatedAt: Date;
  workspace?: Workspace;
  project?: Project;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  users: User[];
  projects: Project[];
  workspaces: Workspace[];
}

export interface TaskLog {
  id: string;
  taskId: string;
  task: Task;
  userId: string;
  user: User;
  hoursSpent: number;
  description: string | null;
  logDate: Date;
  createdAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  task: Task;
  userId: string;
  user: User;
  content: string;
  parentId: string | null;
  parent: Comment | null;
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  customStatus?: string;
  statusCategory?: StatusCategory;
  type?: string;
  customType?: string;
  assignees?: string[];
  tags?: string[];
  subTasks?: Array<{
    title: string;
    description?: string;
    userId?: string;
  }>;
  customFields?: Array<{
    fieldId: string;
    value?: string;
  }>;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: TaskStatus;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  projectName?: string;
  projectDocument?: string;
  memberIds?: string[];
  workspaceId?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  completedAt?: Date | null;
}
