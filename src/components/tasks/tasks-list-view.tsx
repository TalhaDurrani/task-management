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
import { ComprehensiveTaskDetailModal } from "./comprehensive-task-detail-modal";
import { getStatusColor, getStatusLabel, normalizeStatusForAPI, normalizeStatusFromAPI, getNumericStatus } from "@/lib/status-utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: number | string | { name: string } | null;
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
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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
    { name: string; color?: string; category?: string }[]
  >([
    { name: "TODO", color: "#GRAY", category: "BACKLOG" },
    { name: "IN_PROGRESS", color: "#BLUE", category: "IN_PROGRESS" },
    { name: "DONE", color: "#GREEN", category: "COMPLETED" },
  ]);

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
        return "text-purple-600 bg-purple-100";
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
        // Convert workflow columns to status format
        const workflowStatusOptions = workflowStatuses.map(col => ({
          name: col.title,
          color: col.color
        }))
        setAvailableStatuses(workflowStatusOptions)
      } else {
        // Fetch statuses
        const statusesResponse = await fetch("/api/tasks/status");
        if (statusesResponse.ok) {
          const statusesData = await statusesResponse.json();
          console.log("📥 Loaded statuses from API:", statusesData); // Debug log
          setAvailableStatuses(statusesData);
        }
      }
    } catch (error) {
      console.error("Failed to load types and statuses:", error);
    }
  };

  // For development/testing - if tasks don't have assignees data, show as unassigned
  // In production, tasks should come with proper assignee data from the API
  // Expected task structure:
  // {
  //   id: string,
  //   title: string,
  //   type?: "bug" | "feature" | "story" | "epic" | "task" | "subtask",
  //   status: "todo" | "in-progress" | "done",
  //   priority: "low" | "medium" | "high" | "critical",
  //   assignees?: Array<{id: string, name: string, avatar?: string}>,
  //   assignee?: {id: string, name: string, avatar?: string} // backward compatibility
  // }

  // Update tasks when initialTasks prop changes (preserve local changes unless forced)
  useEffect(() => {
    // Only update if we don't have local tasks or if initialTasks is significantly different
    const hasSignificantChanges =
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
    if (projectId) {
      setIsRefreshing(true);
      try {
        const response = await fetch(`/api/tasks?projectId=${projectId}`);
        if (response.ok) {
          const updatedTasks = await response.json();
          setTasks(updatedTasks);
        }
      } catch (error) {
        console.error("Error refreshing tasks:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [projectId]);

  // Real-time data refresh function
  const refreshTasks = useCallback(async () => {
    if (!projectId || !enableRealTimeUpdates) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const updatedTasks = await response.json();
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, enableRealTimeUpdates]);

  // Set up real-time polling
  useEffect(() => {
    if (!projectId || !enableRealTimeUpdates) return;

    const interval = setInterval(refreshTasks, refreshInterval || 15000); // Default to 15 seconds
    return () => clearInterval(interval);
  }, [refreshTasks, refreshInterval, projectId, enableRealTimeUpdates]);

  // Load types and statuses on component mount
  useEffect(() => {
    loadTypesAndStatuses();
  }, []);

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

  const handleInlineEdit = (task: Task) => {
    setEditingTask(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (editingTitle.trim()) {
      try {
        // Call API to update task title
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: editingTitle.trim() }),
        });

        if (response.ok) {
          // Optimistically update local state
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId
                ? { ...task, title: editingTitle.trim() }
                : task
            )
          );
        } else {
          console.error("Failed to update task title");
        }
      } catch (error) {
        console.error("Error updating task title:", error);
      }
    }
    setEditingTask(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditingTitle("");
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
    if (!originalTask) {
      console.error("❌ Task not found:", taskId);
      return;
    }

    const newStatus = getNumericStatus(status);

    // Optimistically update the UI immediately
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );

    try {
      // Normalize status for API call
      const normalizedStatus = normalizeStatusForAPI(status);

      // Make API call to update task status
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: normalizedStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ API Error Response:", error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Status update successful for task ${taskId}: ${originalTask.status} -> ${result.status}`);

      // Update local state with the response from server
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              status: typeof result.status === 'number' ? result.status : getNumericStatus(result.status.toString()),
              completedAt: result.completedAt,
              // Update any other fields that might have changed
              ...(result.priority && { priority: result.priority }),
              ...(result.description && { description: result.description }),
            };
          }
          return task;
        });
        return updatedTasks;
      });

      // Trigger callbacks if provided
      onTaskStatusChange?.(taskId, normalizedStatus);

      // Call onTaskMove to trigger parent refresh
      if (onTaskMove) {
        onTaskMove(taskId, normalizedStatus);
      }

      // Brief refresh indication
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 100);
    } catch (error) {
      console.error("💥 Error updating task status:", error);

      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, status: originalTask.status }
            : task
        )
      );

      // Optionally show user-friendly error notification
      // toast?.error?.("Failed to update task status. Please try again.")
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
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="flex items-center justify-between">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-8 px-3 py-3"></th>
                <th className="w-8 px-3 py-3"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Task Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="w-12 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    selectedTasks.includes(task.id)
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                  onMouseEnter={() => setHoveredRow(task.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Drag Handle */}
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center">
                      <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move" />
                    </div>
                  </td>

                  {/* Checkbox */}
                  <td className="px-3 py-4">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) =>
                        handleSelectTask(task.id, checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </td>

                  {/* Task Name */}
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {editingTask === task.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                className="h-8 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveEdit(task.id);
                                  } else if (e.key === "Escape") {
                                    handleCancelEdit();
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleSaveEdit(task.id)}
                              >
                                ✓
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleCancelEdit}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3
                                className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                onClick={() => handleInlineEdit(task)}
                              >
                                {task.title}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleInlineEdit(task)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {(task.commentsCount || 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MessageSquare className="h-3 w-3" />
                              <span>{task.commentsCount}</span>
                            </div>
                          )}
                          {(task.attachmentsCount || 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Paperclip className="h-3 w-3" />
                              <span>{task.attachmentsCount}</span>
                            </div>
                          )}
                          {(task.timeSpent || 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{task.timeSpent}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4">
                    {task.type ? (
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${getTaskTypeColor(
                          task.type
                        )}`}
                      >
                        {formatTaskType(task.type)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Task
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <Select
                      value={task.status?.toString()}
                      onValueChange={(value) => {
                        handleStatusChange(task.id, value);
                      }}
                    >
                      <SelectTrigger className="w-auto h-8 p-1 border-0 bg-transparent">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium cursor-pointer ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {getStatusLabel(task.status)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="1">Todo</SelectItem>
                        <SelectItem value="2">In Progress</SelectItem>
                        <SelectItem value="3">Done</SelectItem>
                        {availableStatuses.filter(status =>
                          !['TODO', 'IN_PROGRESS', 'DONE'].includes(status.name)
                        ).map((status) => (
                          <SelectItem key={status.name} value={status.name}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color || '#gray' }}
                              ></div>
                              <span>{status.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-4">
                    <Select
                      value={task.priority}
                      onValueChange={(value) =>
                        handlePriorityChange(task.id, value)
                      }
                    >
                      <SelectTrigger className="w-auto h-8 p-1 border-0 bg-transparent">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium cursor-pointer ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Assigned To */}
                  <td className="px-4 py-4">
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {task.assignees.slice(0, 2).map((assignee, index) => (
                          <div
                            key={assignee.id}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={assignee.avatar} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {assignee.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {assignee.name}
                              {index === 0 &&
                              task.assignees &&
                              task.assignees.length > 2
                                ? ` +${task.assignees.length - 2}`
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          hoveredRow === task.id ? "opacity-100" : "opacity-0"
                        } transition-opacity`}
                        onClick={() => onTaskEdit?.(task)}
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

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{filteredAndSortedTasks.length} tasks total</span>
            <div className="flex items-center gap-4">
              <span>Auto-save enabled</span>
              {enableRealTimeUpdates && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isRefreshing
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <span className="text-xs">
                    {isRefreshing ? "Refreshing..." : "Live updates"}
                  </span>
                </div>
              )}
              <CreateTaskDialog 
                onTaskCreated={onTaskCreated}
                projectId={projectId}
                workflowStatuses={workflowStatuses}
              >
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Add task
                </Button>
              </CreateTaskDialog>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <ComprehensiveTaskDetailModal
          taskId={selectedTask.id}
          isOpen={isTaskDetailOpen}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={() => {
            refreshTasks();
          }}
        />
      )}
    </>
  );
}
