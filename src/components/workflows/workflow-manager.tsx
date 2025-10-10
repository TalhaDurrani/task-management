"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  Columns,
  Star,
} from "lucide-react"

interface WorkflowColumn {
  id: string
  title: string
  color: string
  limit?: number
}

interface Workflow {
  id: string
  projectId: string
  userId: string
  name: string
  columns: WorkflowColumn[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface WorkflowManagerProps {
  projectId: string
  onWorkflowSelect?: (workflow: Workflow) => void
  selectedWorkflowId?: string
}

export function WorkflowManager({
  projectId,
  onWorkflowSelect,
  selectedWorkflowId
}: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)

  // Form states
  const [newWorkflowName, setNewWorkflowName] = useState("")
  const [newWorkflowColumns, setNewWorkflowColumns] = useState<WorkflowColumn[]>([
    { id: "1", title: "To Do", color: "#6B7280", limit: 0 },
    { id: "2", title: "In Progress", color: "#3B82F6", limit: 0 },
    { id: "3", title: "Done", color: "#10B981", limit: 0 },
  ])
  const [isDefault, setIsDefault] = useState(false)

  // Load workflows
  const loadWorkflows = async () => {
    try {
      const response = await fetch(`/api/workflows?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data)
      }
    } catch (error) {
      console.error("Error loading workflows:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows()
  }, [projectId])

  // Create workflow
  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) return

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          name: newWorkflowName,
          columns: newWorkflowColumns,
          isDefault,
        }),
      })

      if (response.ok) {
        const newWorkflow = await response.json()
        setWorkflows([...workflows, newWorkflow])
        setNewWorkflowName("")
        setNewWorkflowColumns([
          { id: "1", title: "To Do", color: "#6B7280", limit: 0 },
          { id: "2", title: "In Progress", color: "#3B82F6", limit: 0 },
          { id: "3", title: "Done", color: "#10B981", limit: 0 },
        ])
        setIsDefault(false)
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating workflow:", error)
    }
  }

  // Update workflow
  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow || !editingWorkflow.name.trim()) return

    try {
      const response = await fetch(`/api/workflows/${editingWorkflow.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingWorkflow.name,
          columns: editingWorkflow.columns,
          isDefault: editingWorkflow.isDefault,
        }),
      })

      if (response.ok) {
        const updatedWorkflow = await response.json()
        setWorkflows(workflows.map(w => w.id === editingWorkflow.id ? updatedWorkflow : w))
        setIsEditDialogOpen(false)
        setEditingWorkflow(null)
      }
    } catch (error) {
      console.error("Error updating workflow:", error)
    }
  }

  // Delete workflow
  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWorkflows(workflows.filter(w => w.id !== workflowId))
        if (selectedWorkflowId === workflowId) {
          // Select first available workflow or none
          const remainingWorkflows = workflows.filter(w => w.id !== workflowId)
          onWorkflowSelect?.(remainingWorkflows[0] || null)
        }
      }
    } catch (error) {
      console.error("Error deleting workflow:", error)
    }
  }

  // Set as default
  const handleSetDefault = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId)
      if (!workflow) return

      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isDefault: true,
        }),
      })

      if (response.ok) {
        const updatedWorkflow = await response.json()
        setWorkflows(workflows.map(w => ({
          ...w,
          isDefault: w.id === workflowId
        })))
      }
    } catch (error) {
      console.error("Error setting default workflow:", error)
    }
  }

  // Add column to workflow
  const addColumn = () => {
    const newColumn: WorkflowColumn = {
      id: Date.now().toString(),
      title: "New Column",
      color: "#6B7280",
      limit: 0,
    }
    setNewWorkflowColumns([...newWorkflowColumns, newColumn])
  }

  // Update column
  const updateColumn = (index: number, field: keyof WorkflowColumn, value: string | number) => {
    const updatedColumns = [...newWorkflowColumns]
    updatedColumns[index] = { ...updatedColumns[index], [field]: value }
    setNewWorkflowColumns(updatedColumns)
  }

  // Remove column
  const removeColumn = (index: number) => {
    if (newWorkflowColumns.length > 1) {
      setNewWorkflowColumns(newWorkflowColumns.filter((_, i) => i !== index))
    }
  }

  // Edit workflow functions
  const startEdit = (workflow: Workflow) => {
    setEditingWorkflow({ ...workflow })
    setIsEditDialogOpen(true)
  }

  const updateEditColumn = (index: number, field: keyof WorkflowColumn, value: string | number) => {
    if (!editingWorkflow) return
    const updatedColumns = [...editingWorkflow.columns]
    updatedColumns[index] = { ...updatedColumns[index], [field]: value }
    setEditingWorkflow({ ...editingWorkflow, columns: updatedColumns })
  }

  const addEditColumn = () => {
    if (!editingWorkflow) return
    const newColumn: WorkflowColumn = {
      id: Date.now().toString(),
      title: "New Column",
      color: "#6B7280",
      limit: 0,
    }
    setEditingWorkflow({
      ...editingWorkflow,
      columns: [...editingWorkflow.columns, newColumn]
    })
  }

  const removeEditColumn = (index: number) => {
    if (!editingWorkflow || editingWorkflow.columns.length <= 1) return
    setEditingWorkflow({
      ...editingWorkflow,
      columns: editingWorkflow.columns.filter((_, i) => i !== index)
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns className="h-5 w-5" />
            Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Columns className="h-5 w-5" />
              Workflows
            </CardTitle>
            <CardDescription>
              Manage project workflows and columns
            </CardDescription>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Create a new workflow with custom columns for your project.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    placeholder="e.g., Development Workflow"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Columns</Label>
                    <Button variant="outline" size="sm" onClick={addColumn}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Column
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {newWorkflowColumns.map((column, index) => (
                      <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Input
                            value={column.title}
                            onChange={(e) => updateColumn(index, "title", e.target.value)}
                            placeholder="Column title"
                          />
                        </div>

                        <div className="w-32">
                          <Input
                            type="color"
                            value={column.color}
                            onChange={(e) => updateColumn(index, "color", e.target.value)}
                            className="h-8 p-1"
                          />
                        </div>

                        <div className="w-20">
                          <Input
                            type="number"
                            value={column.limit || ""}
                            onChange={(e) => updateColumn(index, "limit", parseInt(e.target.value) || 0)}
                            placeholder="Limit"
                            min="0"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(index)}
                          disabled={newWorkflowColumns.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="is-default">Set as default workflow</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow} disabled={!newWorkflowName.trim()}>
                  Create Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {workflows.length === 0 ? (
          <div className="text-center py-8">
            <Columns className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workflow to organize your project tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflowId === workflow.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => onWorkflowSelect?.(workflow)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{workflow.name}</h3>
                      {workflow.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {workflow.columns.slice(0, 4).map((column) => (
                        <div
                          key={column.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: column.color + "20", color: column.color }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: column.color }}
                          />
                          {column.title}
                        </div>
                      ))}
                      {workflow.columns.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{workflow.columns.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetDefault(workflow.id)
                      }}
                      disabled={workflow.isDefault}
                    >
                      <Star className={`h-4 w-4 ${workflow.isDefault ? "fill-current" : ""}`} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(workflow)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>
              Update workflow name and columns.
            </DialogDescription>
          </DialogHeader>

          {editingWorkflow && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-workflow-name">Workflow Name</Label>
                <Input
                  id="edit-workflow-name"
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                  placeholder="e.g., Development Workflow"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Columns</Label>
                  <Button variant="outline" size="sm" onClick={addEditColumn}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Column
                  </Button>
                </div>

                <div className="space-y-3">
                  {editingWorkflow.columns.map((column, index) => (
                    <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Input
                          value={column.title}
                          onChange={(e) => updateEditColumn(index, "title", e.target.value)}
                          placeholder="Column title"
                        />
                      </div>

                      <div className="w-32">
                        <Input
                          type="color"
                          value={column.color}
                          onChange={(e) => updateEditColumn(index, "color", e.target.value)}
                          className="h-8 p-1"
                        />
                      </div>

                      <div className="w-20">
                        <Input
                          type="number"
                          value={column.limit || ""}
                          onChange={(e) => updateEditColumn(index, "limit", parseInt(e.target.value) || 0)}
                          placeholder="Limit"
                          min="0"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEditColumn(index)}
                        disabled={editingWorkflow.columns.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWorkflow} disabled={!editingWorkflow?.name.trim()}>
              Update Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
