"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  User,
  Flag,
  MessageSquare,
  Paperclip,
  Clock,
  Edit2,
  Trash2,
  GripVertical,
  Plus,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  Star,
  RefreshCw,
  Tag,
  UserPlus,
  X,
  CheckSquare,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskDetailModal } from "./task-detail-modal";
import { getStatusColor, getStatusLabel, normalizeStatusForAPI, normalizeStatusFromAPI, getNumericStatus } from "@/lib/status-utils";
import { useWorkspace } from "@/components/providers/workspace-provider"

interface Task {
  id: string;
  title: string;
  description?: string;
  status: number | string | { name: string } | null;
  customStatus?: string | null;
  statusCategory?: string;
  priority: "low" | "medium" | "high" | "critical";
  type?: "bug" | "feature" | "story" | "epic" | "task" | "subtask";
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  project: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  assignees?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  commentsCount?: number;
  attachmentsCount?: number;
  timeSpent?: number;
}

interface TasksListViewProps {
  tasks: Task[];
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskMove?: (taskId: string, newStatus: string) => void;
  onBulkEdit?: (taskIds: string[]) => void;
  onBulkDelete?: (taskIds: string[]) => void;
  onTaskAssign?: (taskId: string, userId: string) => void;
  onTaskDueDate?: (taskId: string, dueDate: Date) => void;
  onTaskStatusChange?: (taskId: string, status: string) => void;
  onTaskPriorityChange?: (taskId: string, priority: string) => void;
  onCreateTask?: () => void;
  onTaskCreated?: () => void;
  projectId?: string;
  enableRealTimeUpdates?: boolean;
  refreshInterval?: number;
  workflowStatuses?: Array<{
    id: string;
    title: string;
    color: string;
    icon: any;
  }>;
}

const formatTaskType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export function TasksListView({
  tasks: initialTasks,
  onTaskEdit,
  onTaskDelete,
  onTaskMove,
  onBulkEdit,
  onBulkDelete,
  onTaskAssign,
  onTaskDueDate,
  onTaskStatusChange,
  onTaskPriorityChange,
  onCreateTask,
  onTaskCreated,
  projectId,
  enableRealTimeUpdates = false,
  refreshInterval = 30000,
  workflowStatuses,
}: TasksListViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add missing state variables
  const [showFilter, setShowFilter] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Add dynamic types and statuses state
  const [availableTypes, setAvailableTypes] = useState<
    { name: string; color?: string }[]
  >([
    { name: "TASK", color: "#4A90E2" },
    { name: "BUG", color: "#FF6B6B" },
    { name: "FEATURE", color: "#2ECC71" },
    { name: "EPIC", color: "#9B59B6" },
    { name: "STORY", color: "#F39C12" },
    { name: "SUBTASK", color: "#95A5A6" },
  ]);

  const [availableStatuses, setAvailableStatuses] = useState<
    { id?: string; name: string; color?: string; category?: string }[]
  >([
    { name: "TODO", color: "#GRAY", category: "BACKLOG" },
    { name: "IN_PROGRESS", color: "#BLUE", category: "IN_PROGRESS" },
    { name: "DONE", color: "#GREEN", category: "COMPLETED" },
  ]);

  // State for workspace users and tags
  const [workspaceUsers, setWorkspaceUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>>([]);

  const [workspaceTags, setWorkspaceTags] = useState<Array<{
    id: string;
    name: string;
    color?: string;
  }>>([]);

  const { selectedWorkspace } = useWorkspace()

  // Helper functions for styling with dynamic support

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "text-red-600 bg-red-100";
      case "HIGH":
        return "text-orange-600 bg-orange-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "LOW":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTaskTypeColor = (type: string) => {
    // Safety check to ensure availableTypes is an array
    if (!Array.isArray(availableTypes)) {
      return "text-gray-600 bg-gray-100";
    }

    const typeItem = availableTypes.find(
      (t: { name: string; color?: string }) => t.name === type
    );
    if (typeItem?.color) {
      // Convert hex color to tailwind-like classes
      const colorMap: Record<string, string> = {
        "#4A90E2": "text-blue-600 bg-blue-100",
        "#FF6B6B": "text-red-600 bg-red-100",
        "#2ECC71": "text-green-600 bg-green-100",
        "#9B59B6": "text-purple-600 bg-purple-100",
        "#F39C12": "text-orange-600 bg-orange-100",
        "#95A5A6": "text-gray-600 bg-gray-100",
      };
      return colorMap[typeItem.color] || "text-gray-600 bg-gray-100";
    }

    // Fallback to default colors
    switch (type) {
      case "BUG":
        return "text-red-600 bg-red-100";
      case "FEATURE":
        return "text-green-600 bg-green-100";
      case "STORY":
        return "text-blue-600 bg-blue-100";
      case "EPIC":
        return "text-indigo-600 bg-indigo-100";
      case "TASK":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Load dynamic types and statuses
  const loadTypesAndStatuses = async () => {
    try {
      // Fetch types
      const typesResponse = await fetch("/api/tasks/type");
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        // Flatten the default and custom types into a single array
        const allTypes = [
          ...(typesData.default || []),
          ...(typesData.custom || []),
        ];
        setAvailableTypes(allTypes);
      }

      // Use workflow statuses if provided, otherwise load from API
      if (workflowStatuses && workflowStatuses.length > 0) {
        // Convert workflow columns to status format with proper structure
        const workflowStatusOptions = workflowStatuses.map((col: any) => ({
          id: col.id,
          name: col.title,
          color: col.color,
          category: col.category || 'BACKLOG' // Default category if not provided
        }))
        console.log("Setting available statuses from workflow:", workflowStatusOptions);
        setAvailableStatuses(workflowStatusOptions)
      } else {
        // Fetch statuses from workspace API
        const userResponse = await fetch("/api/auth/me")
        let workspaceId = null
        if (userResponse.ok) {
          const userData = await userResponse.json()
          workspaceId = userData.workspaceId
        }

        if (workspaceId) {
          const statusesResponse = await fetch(`/api/tasks/status?workspaceId=${workspaceId}`);
          if (statusesResponse.ok) {
            const statusesData = await statusesResponse.json();
            console.log("📥 Loaded statuses from API:", statusesData);
            setAvailableStatuses(statusesData.map((status: any) => ({ ...status, category: status.category || 'BACKLOG' })));
          }
        }
      };
    } catch (error) {
      console.error("Failed to load types and statuses:", error);
    }
  };
// Update tasks when initialTasks prop changes (preserve local changes unless forced)
  useEffect(() => {
    // Only update if we don't have local tasks or if initialTasks is significantly different
    const hasSignificantChanges =
      tasks.length === 0 ||
      initialTasks.length !== tasks.length ||
      initialTasks.some((initTask, index) => {
        const localTask = tasks[index];
        return !localTask || initTask.id !== localTask.id;
      });

    if (tasks.length === 0 || hasSignificantChanges) {
      // Normalize initial tasks to ensure consistent status format
      const normalizedTasks = initialTasks.map((task) => ({
        ...task,
        status: typeof task.status === 'number' ? task.status : getNumericStatus(task.status as string),
      }));
      setTasks(normalizedTasks);
    }
  }, [initialTasks]);

  // Add function to force refresh from server
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Prioritize projectId if available, otherwise use workspaceId
      let url = '/api/tasks?'
      if (projectId) {
        url += `projectId=${projectId}`
      } else if (selectedWorkspace) {
        url += `workspaceId=${selectedWorkspace.id}`
      }

      const response = await fetch(url);
      if (response.ok) {
        const updatedTasks = await response.json();
        // Filter by projectId if specified (safety measure)
        const filteredTasks = projectId 
          ? updatedTasks.filter((task: any) => task.projectId === projectId)
          : updatedTasks;
        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, selectedWorkspace?.id]);

  // Real-time data refresh function
  const refreshTasks = useCallback(async () => {
    if (!enableRealTimeUpdates) return;

    setIsRefreshing(true);
    try {
      // Prioritize projectId if available, otherwise use workspaceId
      let url = '/api/tasks?'
      if (projectId) {
        url += `projectId=${projectId}`
      } else if (selectedWorkspace) {
        url += `workspaceId=${selectedWorkspace.id}`
      }

      const response = await fetch(url);
      if (response.ok) {
        const updatedTasks = await response.json();
        // Filter by projectId if specified (safety measure)
        const filteredTasks = projectId 
          ? updatedTasks.filter((task: any) => task.projectId === projectId)
          : updatedTasks;
        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, enableRealTimeUpdates, selectedWorkspace?.id]);

  // Set up real-time polling
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const interval = setInterval(refreshTasks, refreshInterval || 15000); // Default to 15 seconds
    return () => clearInterval(interval);
  }, [refreshTasks, refreshInterval, enableRealTimeUpdates]);

  // Load types and statuses on component mount and when workflowStatuses change
  useEffect(() => {
    loadTypesAndStatuses();
  }, [workflowStatuses]);

  // Load workspace users and tags
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!selectedWorkspace) return;

      try {
        // Fetch workspace users
        const usersResponse = await fetch(`/api/users?workspaceId=${selectedWorkspace.id}`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setWorkspaceUsers(usersData.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          })));
        }

        // Fetch workspace tags
        const tagsResponse = await fetch(`/api/tags?workspaceId=${selectedWorkspace.id}`);
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setWorkspaceTags(tagsData);
        }
      } catch (error) {
        console.error('Error loading workspace data:', error);
      }
    };

    loadWorkspaceData();
  }, [selectedWorkspace]);

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter((id) => id !== taskId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(tasks.map((task) => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkEdit = async () => {
    if (selectedTasks.length > 0) {
      try {
        // Call API for bulk operations - using individual task updates
        const updatePromises = selectedTasks.map((taskId) =>
          fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              // You can customize what gets updated in bulk edit
              status: "in-progress", // Example: mark all as in progress
            }),
          })
        );

        const responses = await Promise.all(updatePromises);
        const allSuccessful = responses.every((response) => response.ok);
        const response = responses[0]; // Use first response for status check

        if (allSuccessful) {
          // Call the callback
          onBulkEdit?.(selectedTasks);
        } else {
          console.error("Some bulk edit operations failed");
        }
      } catch (error) {
        console.error("Error in bulk edit:", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length > 0) {
      try {
        // Call API for bulk delete - using individual task deletes
        const deletePromises = selectedTasks.map((taskId) =>
          fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
          })
        );

        const responses = await Promise.all(deletePromises);
        const allSuccessful = responses.every((response) => response.ok);
        const response = responses[0]; // Use first response for status check

        if (allSuccessful) {
          // Remove tasks from local state
          setTasks((prevTasks) =>
            prevTasks.filter((task) => !selectedTasks.includes(task.id))
          );
          setSelectedTasks([]);
          onBulkDelete?.(selectedTasks);
        } else {
          console.error("Some bulk delete operations failed");
        }
      } catch (error) {
        console.error("Error in bulk delete:", error);
      }
    }
  };


  const handleTaskAssign = async (taskId: string, userId: string) => {
    try {
      // Optimistically update local state first
      const currentTask = tasks.find((t) => t.id === taskId);
      if (!currentTask) return;

      // Get user data from API
      const userResponse = await fetch(`/api/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();

        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  assignees: task.assignees
                    ? [...task.assignees, userData]
                    : [userData],
                  assignee: userData, // Keep backward compatibility
                }
              : task
          )
        );
      }

      // Call the callback to handle the actual assignment
      onTaskAssign?.(taskId, userId);
    } catch (error) {
      console.error("Error assigning task:", error);
    }
  };

  const handleTaskDueDate = async (taskId: string, dueDate: Date) => {
    const originalDueDate = tasks.find((t) => t.id === taskId)?.dueDate;

    try {
      // Optimistically update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, dueDate: dueDate.toISOString() }
            : task
        )
      );

      // Call API to update due date
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dueDate: dueDate.toISOString() }),
      });

      if (!response.ok) {
        console.error("Failed to update task due date");
        // Revert optimistic update on error
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, dueDate: originalDueDate } // Revert to original due date
              : task
          )
        );
      }
    } catch (error) {
      console.error("Error updating task due date:", error);
      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, dueDate: originalDueDate } // Revert to original due date
            : task
        )
      );
    }

    onTaskDueDate?.(taskId, dueDate);
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    const originalTask = tasks.find((t) => t.id === taskId);
    if (!originalTask) return;

    // Simplified status mapping
    const mapStatus = (statusStr: string) => {
      // Check if it's a built-in numeric status
      if (['1', '2', '3'].includes(statusStr)) {
        return { status: parseInt(statusStr, 10), customStatus: undefined };
      }
      
      // Check if it's a built-in status name
      const normalized = statusStr.toLowerCase();
      if (['todo', 'backlog'].includes(normalized)) {
        return { status: 1, customStatus: undefined };
      }
      if (normalized.includes('progress')) {
        return { status: 2, customStatus: undefined };
      }
      if (['done', 'completed'].includes(normalized)) {
        return { status: 3, customStatus: undefined };
      }

      // Look up in available custom statuses
      const customStatus = availableStatuses.find((s) => String(s.id) === statusStr);
      if (customStatus) {
        const categoryMap: Record<string, number> = {
          'BACKLOG': 1, 'IN_PROGRESS': 2, 'COMPLETED': 3, 'ON_HOLD': 1
        };
        return {
          status: categoryMap[customStatus.category || 'BACKLOG'] || 1,
          customStatus: String(customStatus.name)
        };
      }

      // Fallback: treat as custom status name
      return { status: 1, customStatus: statusStr };
    };

    const { status: resolvedNumericStatus, customStatus: customStatusName } = mapStatus(String(status));

    // Optimistically update the UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: customStatusName ? customStatusName : resolvedNumericStatus }
          : task
      )
    );

    try {
      const payload: any = { status: resolvedNumericStatus };
      if (customStatusName) payload.customStatus = String(customStatusName);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Update local state with the response from server
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              status: typeof result.status === 'number' ? result.status : getNumericStatus(result.status.toString()),
              completedAt: result.completedAt,
              ...(result.priority && { priority: result.priority }),
              ...(result.description && { description: result.description }),
            };
          }
          return task;
        });
        return updatedTasks;
      });

      // Trigger callbacks if provided
      onTaskStatusChange?.(taskId, customStatusName ? customStatusName : String(resolvedNumericStatus));

      // Call onTaskMove to trigger parent refresh
      if (onTaskMove) {
        onTaskMove(taskId, customStatusName ? customStatusName : String(resolvedNumericStatus));
      }

      // Brief refresh indication
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 100);
    } catch (error) {
      console.error("Error updating task status:", error);

      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, status: originalTask.status }
            : task
        )
      );
    }
  };

  const handlePriorityChange = async (taskId: string, priority: string) => {
    const originalPriority = tasks.find((t) => t.id === taskId)?.priority;

    try {
      // Optimistically update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                priority: priority as "low" | "medium" | "high" | "critical",
              }
            : task
        )
      );

      // Call API to update priority
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority }),
      });

      if (response.ok) {
        // Update was successful - refresh the data to ensure consistency
        if (projectId && enableRealTimeUpdates) {
          setTimeout(() => refreshTasks(), 100); // Small delay to ensure DB commit
        }
      } else {
        console.error("Failed to update task priority");
        // Revert optimistic update on error
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, priority: originalPriority || "medium" } // Revert to original priority with fallback
              : task
          )
        );
      }
    } catch (error) {
      console.error("Error updating task priority:", error);
      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, priority: originalPriority || "medium" } // Revert to original priority with fallback
            : task
        )
      );
    }

    onTaskPriorityChange?.(taskId, priority);
  };

  const handlePopoverOpen = (popoverId: string, isOpen: boolean) => {
    if (isOpen) {
      // Close all other popovers when opening one
      setOpenPopovers({ [popoverId]: true });
    } else {
      setOpenPopovers((prev) => ({ ...prev, [popoverId]: false }));
    }
  };

  const handleAssignUser = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, assignees: updatedTask.assignees } : task
          )
        );

        // Call callback if provided
        onTaskAssign?.(taskId, userId);

        // Trigger parent refresh
        if (onTaskEdit) {
          onTaskEdit(updatedTask);
        }
      }
    } catch (error) {
      console.error("Error assigning user to task:", error);
    }
  };

  const handleAddTag = async (taskId: string, tagId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagId }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, tags: updatedTask.tags } : task
          )
        );

        // Trigger parent refresh
        if (onTaskEdit) {
          onTaskEdit(updatedTask);
        }
      }
    } catch (error) {
      console.error("Error adding tag to task:", error);
    }
  };

  const handleRemoveTag = async (taskId: string, tagId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId 
              ? { ...task, tags: task.tags?.filter(t => t.id !== tagId) } 
              : task
          )
        );

        // Trigger parent refresh
        if (onTaskEdit) {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            onTaskEdit(task);
          }
        }
      }
    } catch (error) {
      console.error("Error removing tag from task:", error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleTaskUpdate = async (updatedTask: Partial<Task>) => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        // Optimistically update the task in the list
        const updatedTaskData = await response.json();
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === selectedTask.id ? { ...task, ...updatedTaskData } : task
          )
        );

        // Refresh tasks if needed
        if (projectId && enableRealTimeUpdates) {
          setTimeout(() => refreshTasks(), 200);
        }
      } else {
        console.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "status": {
          // Handle numeric status sorting
          const aStatus = typeof a.status === 'number' ? a.status : String(a.status);
          const bStatus = typeof b.status === 'number' ? b.status : String(b.status);
          return aStatus.toString().localeCompare(bStatus.toString());
        }
        case "priority":
          return a.priority.localeCompare(b.priority);
        case "dueDate":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });


  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header Toolbar - ClickUp Style */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    selectedTasks.length === tasks.length && tasks.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedTasks.length > 0
                    ? `${selectedTasks.length} selected`
                    : `${tasks.length} tasks`}
                </span>
              </div>

              {selectedTasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {}}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handleBulkEdit}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-red-600 hover:text-red-700"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Popover open={showFilter} onOpenChange={setShowFilter}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 z-50">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filter Tasks</h4>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          {availableStatuses.map((status) => (
                            <SelectItem key={status.name} value={getNumericStatus(status.name).toString()}>
                              {getStatusLabel(getNumericStatus(status.name))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover open={showSort} onOpenChange={setShowSort}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Sort
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-4 z-50">
                  <div className="space-y-4">
                    <h4 className="font-medium">Sort Tasks</h4>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover open={showSearch} onOpenChange={setShowSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 z-50">
                  <div className="space-y-4">
                    <h4 className="font-medium">Search Tasks</h4>
                    <Input
                      placeholder="Search by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {enableRealTimeUpdates && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={refreshTasks}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Professional Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="w-12 px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedTasks.length === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTasks(filteredAndSortedTasks.map(t => t.id));
                        } else {
                          setSelectedTasks([]);
                        }
                      }}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Task</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Priority</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Assignee</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Due Date</span>
                  </th>
                  <th className="w-16 px-6 py-3"></th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAndSortedTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-150 cursor-pointer ${
                    selectedTasks.includes(task.id)
                      ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-500"
                      : "border-l-2 border-l-transparent"
                  }`}
                  onClick={() => handleTaskClick(task)}
                >
                  {/* Checkbox */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) =>
                        handleSelectTask(task.id, checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </td>

                  {/* Task Name & Details */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {task.type && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium px-1.5 py-0.5 ${getTaskTypeColor(task.type)}`}
                          >
                            {formatTaskType(task.type)}
                          </Badge>
                        )}
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {task.title}
                        </h3>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {(task.commentsCount || 0) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{task.commentsCount}</span>
                          </div>
                        )}
                        {(task.attachmentsCount || 0) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{task.attachmentsCount}</span>
                          </div>
                        )}
                        {(task.timeSpent || 0) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{task.timeSpent}h logged</span>
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5" />
                            <span>{task.tags.length} {task.tags.length === 1 ? 'tag' : 'tags'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={
                        task.customStatus 
                          ? availableStatuses.find(s => s.name === task.customStatus)?.id?.toString() || task.customStatus
                          : task.status?.toString()
                      }
                      onValueChange={(value) => {
                        handleStatusChange(task.id, value);
                      }}
                    >
                      <SelectTrigger className="w-full h-9 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ 
                              backgroundColor: availableStatuses.find(s => 
                                s.name === task.customStatus || s.id?.toString() === task.status?.toString()
                              )?.color || '#6B7280'
                            }}
                          />
                          <span className="text-sm font-medium capitalize">
                            {task.customStatus || getStatusLabel(task.status)}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show all statuses from availableStatuses without duplicates */}
                        {availableStatuses
                          .filter((status, index, self) => 
                            // Remove duplicates based on name
                            index === self.findIndex(s => s.name?.toLowerCase() === status.name?.toLowerCase())
                          )
                          .map((status) => {
                            // Map default statuses to their numeric values and colors
                            const isDefaultStatus = ['TODO', 'IN_PROGRESS', 'DONE', 'Todo', 'In Progress', 'Done'].includes(status.name || '')
                            
                            let displayColor = status.color || '#6B7280'
                            let statusValue = String(status.id || status.name)
                            
                            if (isDefaultStatus) {
                              // Map to numeric values for default statuses
                              if (status.name === 'Todo' || status.name === 'TODO') {
                                statusValue = '1'
                                displayColor = '#9CA3AF' // Gray
                              } else if (status.name === 'In Progress' || status.name === 'IN_PROGRESS') {
                                statusValue = '2'
                                displayColor = '#F59E0B' // Orange
                              } else if (status.name === 'Done' || status.name === 'DONE') {
                                statusValue = '3'
                                displayColor = '#10B981' // Green
                              }
                            }
                            
                            // Show all statuses with consistent colored dot format
                            return (
                              <SelectItem key={status.id || status.name} value={statusValue}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: displayColor }}
                                  />
                                  <span className="capitalize">{status.name}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.priority}
                      onValueChange={(value) =>
                        handlePriorityChange(task.id, value)
                      }
                    >
                      <SelectTrigger className="w-full h-9 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                          <Flag className={`h-3.5 w-3.5 ${getPriorityColor(task.priority)}`} />
                          <span className="text-sm font-medium capitalize">
                            {task.priority}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="critical">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-red-500" />
                            <span>Critical</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-orange-500" />
                            <span>High</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-blue-500" />
                            <span>Medium</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-gray-400" />
                            <span>Low</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Assignee */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Popover 
                      open={openPopovers[`assignee-${task.id}`] || false}
                      onOpenChange={(open) => handlePopoverOpen(`assignee-${task.id}`, open)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors w-full justify-start px-2"
                        >
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {task.assignees.slice(0, 2).map((assignee) => (
                                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white dark:border-gray-900">
                                    <AvatarImage src={assignee.avatar} />
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                      {assignee.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {task.assignees.length > 2 ? `+${task.assignees.length - 2}` : ''}
                              </span>
                            </div>
                          ) : task.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignee.avatar} />
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                Assign
                              </span>
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 shadow-lg" align="start">
                        <Command className="rounded-lg border-0">
                          <CommandInput 
                            placeholder="Search users..." 
                            className="h-11 border-b"
                          />
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            No users found.
                          </CommandEmpty>
                          <CommandGroup className="max-h-72 overflow-auto p-2">
                            {workspaceUsers.map((user) => {
                              const isAssigned = task.assignees?.some(a => a.id === user.id) || task.assignee?.id === user.id;
                              return (
                                <CommandItem
                                  key={user.id}
                                  onSelect={() => {
                                    handleAssignUser(task.id, user.id);
                                    handlePopoverOpen(`assignee-${task.id}`, false);
                                  }}
                                  className="flex items-center justify-between gap-3 px-3 py-3 rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                      <AvatarImage src={user.avatar} />
                                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold">
                                        {user.name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {user.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                      </p>
                                    </div>
                                  </div>
                                  {isAssigned && (
                                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                                      ✓ Assigned
                                    </Badge>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {task.dueDate ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">No date</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add more actions
                        }}
                        title="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          {/* Empty State */}
          {filteredAndSortedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
                <CheckSquare className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No tasks found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Get started by creating your first task"}
              </p>
              {!searchTerm && statusFilter === "all" && priorityFilter === "all" && (
                <CreateTaskDialog 
                  onTaskCreated={onTaskCreated}
                  projectId={projectId}
                  workflowStatuses={workflowStatuses}
                >
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </CreateTaskDialog>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{filteredAndSortedTasks.length} tasks total</span>
            <div className="flex items-center gap-6">
              <span className="text-xs">Auto-save enabled</span>
              {enableRealTimeUpdates && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isRefreshing
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <span className="text-xs font-medium">
                    {isRefreshing ? "Refreshing..." : "Live updates"}
                  </span>
                </div>
              )}
              <CreateTaskDialog 
                onTaskCreated={onTaskCreated}
                projectId={projectId}
                workflowStatuses={workflowStatuses}
              >
                <Button variant="ghost" size="sm" className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Add task
                </Button>
              </CreateTaskDialog>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          isOpen={isTaskDetailOpen}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={() => {
            refreshTasks();
          }}
          workflowStatuses={workflowStatuses}
        />
      )}
    </>
  );
}
