"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit, Tag, CircleDot } from "lucide-react"
import { toast } from "sonner"

interface CustomType {
  id: string
  name: string
  color: string
}

interface CustomStatus {
  id?: string
  name: string
  color: string
  category: string
}

interface Tag {
  id: string
  name: string
  color: string
}

export default function CustomFieldsPage() {
  const [types, setTypes] = useState<{ default: CustomType[], custom: CustomType[] }>({ default: [], custom: [] })
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Type dialog state
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<CustomType | null>(null)
  const [typeName, setTypeName] = useState("")
  const [typeColor, setTypeColor] = useState("#6B7280")
  
  // Status dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<CustomStatus | null>(null)
  const [statusName, setStatusName] = useState("")
  const [statusColor, setStatusColor] = useState("#34D399")
  const [statusCategory, setStatusCategory] = useState("BACKLOG")
  
  // Tag dialog state
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tagName, setTagName] = useState("")
  const [tagColor, setTagColor] = useState("#3B82F6")

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Get current user's workspace
      const userResponse = await fetch("/api/auth/me")
      let workspaceId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        workspaceId = userData.workspaceId
      }

      if (!workspaceId) {
        toast.error("No workspace found")
        return
      }

      // Load types
      const typesResponse = await fetch(`/api/tasks/type?workspaceId=${workspaceId}`)
      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        setTypes(typesData)
      }

      // Load statuses
      const statusesResponse = await fetch(`/api/tasks/status?workspaceId=${workspaceId}`)
      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json()
        console.log("Loaded statuses:", statusesData)
        setStatuses(statusesData)
      }

      // Load tags
      const tagsResponse = await fetch(`/api/tags?workspaceId=${workspaceId}`)
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json()
        console.log("Loaded tags:", tagsData)
        setTags(tagsData)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load custom fields")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    
    // Listen for custom field updates from other components
    const handleCustomFieldsUpdate = (event: any) => {
      const { type, action, data } = event.detail
      console.log('Custom fields update received:', { type, action, data })
      
      if (action === 'create') {
        if (type === 'status') {
          setStatuses(prev => {
            // Check if status already exists to avoid duplicates
            const exists = prev.some(s => s.id === data.id || s.name === data.name)
            if (!exists) {
              console.log('Adding new status to UI:', data)
              return [...prev, data]
            }
            return prev
          })
        } else if (type === 'type') {
          setTypes(prev => ({
            ...prev,
            custom: prev.custom.some(t => t.id === data.id || t.name === data.name) 
              ? prev.custom 
              : [...prev.custom, data]
          }))
        }
      }
    }
    
    window.addEventListener('customFieldsUpdated', handleCustomFieldsUpdate)
    
    return () => {
      window.removeEventListener('customFieldsUpdated', handleCustomFieldsUpdate)
    }
  }, [])

  // Type management functions
  const handleCreateType = async () => {
    if (!typeName.trim()) {
      toast.error("Type name is required")
      return
    }

    if (types.custom.some(t => t.name === typeName)) {
      toast.error("Type with the same name already exists")
      return
    }

    try {
      const response = await fetch("/api/tasks/type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: typeName, color: typeColor }),
      })

      if (response.ok) {
        const newType = await response.json()
        setTypes(prev => ({
          ...prev,
          custom: [...prev.custom, newType]
        }))
        toast.success("Custom type created successfully")
        setTypeDialogOpen(false)
        resetTypeForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create type")
      }
    } catch (error) {
      console.error("Error creating type:", error)
      toast.error("An error occurred")
    }
  }

  const handleUpdateType = async () => {
    if (!editingType || !typeName.trim()) return

    try {
      const response = await fetch("/api/tasks/type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingType.id, name: typeName, color: typeColor }),
      })

      if (response.ok) {
        const updatedType = await response.json()
        setTypes(prev => ({
          ...prev,
          custom: prev.custom.map(t => t.id === updatedType.id ? updatedType : t)
        }))
        toast.success("Custom type updated successfully")
        setTypeDialogOpen(false)
        resetTypeForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update type")
      }
    } catch (error) {
      console.error("Error updating type:", error)
      toast.error("An error occurred")
    }
  }

  const handleDeleteType = async (typeId: string, typeName: string) => {
    if (!confirm(`Are you sure you want to delete "${typeName}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/type?id=${typeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTypes(prev => ({
          ...prev,
          custom: prev.custom.filter(t => t.id !== typeId)
        }))
        toast.success("Custom type deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete type")
      }
    } catch (error) {
      console.error("Error deleting type:", error)
      toast.error("An error occurred")
    }
  }

  const openEditType = (type: CustomType) => {
    setEditingType(type)
    setTypeName(type.name)
    setTypeColor(type.color)
    setTypeDialogOpen(true)
  }

  const resetTypeForm = () => {
    setEditingType(null)
    setTypeName("")
    setTypeColor("#6B7280")
  }

  // Status management functions
  const handleCreateStatus = async () => {
    if (!statusName.trim()) {
      toast.error("Status name is required")
      return
    }

    try {
      // Get current user's workspace
      const userResponse = await fetch("/api/auth/me")
      let workspaceId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        workspaceId = userData.workspaceId
      }

      if (!workspaceId) {
        toast.error("No workspace found")
        return
      }

      const response = await fetch("/api/tasks/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: statusName, 
          color: statusColor,
          category: statusCategory,
          workspaceId: workspaceId
        }),
      })

      if (response.ok) {
        const newStatus = await response.json()
        console.log("Created new status:", newStatus)
        setStatuses(prev => [...prev, newStatus])
        toast.success("Custom status created successfully")
        setStatusDialogOpen(false)
        resetStatusForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create status")
      }
    } catch (error) {
      console.error("Error creating status:", error)
      toast.error("An error occurred")
    }
  }

  const handleUpdateStatus = async () => {
    if (!editingStatus || !statusName.trim()) return

    try {
      // Get current user's workspace
      const userResponse = await fetch("/api/auth/me")
      let workspaceId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        workspaceId = userData.workspaceId
      }

      if (!workspaceId) {
        toast.error("No workspace found")
        return
      }

      // All statuses now have IDs since they're created in the database
      const response = await fetch("/api/tasks/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStatus.id,
          name: statusName,
          color: statusColor,
          category: statusCategory,
          workspaceId: workspaceId
        }),
      })

      if (response.ok) {
        const updatedStatus = await response.json()
        setStatuses(prev => prev.map(s => s.id === updatedStatus.id ? updatedStatus : s))
        toast.success("Custom status updated successfully")
        setStatusDialogOpen(false)
        resetStatusForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("An error occurred")
    }
  }

  const handleDeleteStatus = async (statusId: string | undefined, statusName: string) => {
    if (!confirm(`Are you sure you want to delete "${statusName}"? This cannot be undone.`)) {
      return
    }

    try {
      // All statuses now have IDs since they're created in the database
      const response = await fetch(`/api/tasks/status?id=${statusId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setStatuses(prev => prev.filter(s => s.id !== statusId))
        toast.success("Custom status deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete status")
      }
    } catch (error) {
      console.error("Error deleting status:", error)
      toast.error("An error occurred")
    }
  }

  const openEditStatus = (status: CustomStatus) => {
    setEditingStatus(status)
    setStatusName(status.name)
    setStatusColor(status.color)
    setStatusCategory(status.category)
    setStatusDialogOpen(true)
  }

  const resetStatusForm = () => {
    setEditingStatus(null)
    setStatusName("")
    setStatusColor("#34D399")
    setStatusCategory("BACKLOG")
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "BACKLOG": return "bg-gray-500"
      case "IN_PROGRESS": return "bg-blue-500"
      case "COMPLETED": return "bg-green-500"
      case "ON_HOLD": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  // Tag management functions
  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      toast.error("Tag name is required")
      return
    }

    try {
      const userResponse = await fetch("/api/auth/me")
      let workspaceId = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        workspaceId = userData.workspaceId
      }

      if (!workspaceId) {
        toast.error("No workspace found")
        return
      }

      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tagName,
          color: tagColor,
          workspaceId: workspaceId
        }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setTags(prev => [...prev, newTag])
        toast.success("Tag created successfully")
        setTagDialogOpen(false)
        resetTagForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create tag")
      }
    } catch (error) {
      console.error("Error creating tag:", error)
      toast.error("An error occurred")
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !tagName.trim()) return

    try {
      const response = await fetch("/api/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTag.id,
          name: tagName,
          color: tagColor
        }),
      })

      if (response.ok) {
        const updatedTag = await response.json()
        setTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t))
        toast.success("Tag updated successfully")
        setTagDialogOpen(false)
        resetTagForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update tag")
      }
    } catch (error) {
      console.error("Error updating tag:", error)
      toast.error("An error occurred")
    }
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete "${tagName}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/tags?id=${tagId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTags(prev => prev.filter(t => t.id !== tagId))
        toast.success("Tag deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete tag")
      }
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast.error("An error occurred")
    }
  }

  const openEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setTagName(tag.name)
    setTagColor(tag.color)
    setTagDialogOpen(true)
  }

  const resetTagForm = () => {
    setEditingTag(null)
    setTagName("")
    setTagColor("#3B82F6")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading custom fields...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Fields</h1>
        <p className="text-muted-foreground">
          Manage custom task types and statuses for your workspace
        </p>
      </div>

      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">
            <Tag className="mr-2 h-4 w-4" />
            Task Types
          </TabsTrigger>
          <TabsTrigger value="statuses">
            <CircleDot className="mr-2 h-4 w-4" />
            Task Statuses
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="mr-2 h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Task Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Types</CardTitle>
                  <CardDescription>
                    Create custom task types for your workflow (e.g., Task, Bug, Feature, Story)
                  </CardDescription>
                </div>
                <Dialog open={typeDialogOpen} onOpenChange={(open) => {
                  setTypeDialogOpen(open)
                  if (!open) resetTypeForm()
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingType ? "Edit" : "Create"} Task Type</DialogTitle>
                      <DialogDescription>
                        {editingType ? "Update the task type details" : "Add a new custom task type to your workspace"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="type-name">Type Name</Label>
                        <Input
                          id="type-name"
                          placeholder="e.g., Epic, Spike, Sub-task"
                          value={typeName}
                          onChange={(e) => setTypeName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type-color">Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="type-color"
                            type="color"
                            value={typeColor}
                            onChange={(e) => setTypeColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={typeColor}
                            onChange={(e) => setTypeColor(e.target.value)}
                            placeholder="#6B7280"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={editingType ? handleUpdateType : handleCreateType}>
                        {editingType ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Default Types */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Default Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {types.default.map((type) => (
                      <Card key={type.name}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: type.color }}
                            />
                            <span className="font-medium capitalize">{type.name}</span>
                          </div>
                          <Badge variant="secondary">Default</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Custom Types */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Custom Types ({types.custom.length})
                  </h3>
                  {types.custom.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        No custom types yet. Click "Add Type" to create one.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {types.custom.map((type) => (
                        <Card key={type.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: type.color }}
                              />
                              <span className="font-medium capitalize">{type.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditType(type)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteType(type.id, type.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Statuses Tab */}
        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Statuses</CardTitle>
                  <CardDescription>
                    Create custom task statuses for your workflow (e.g., In Review, Testing, Blocked)
                  </CardDescription>
                </div>
                <Dialog open={statusDialogOpen} onOpenChange={(open) => {
                  setStatusDialogOpen(open)
                  if (!open) resetStatusForm()
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingStatus ? "Edit" : "Create"} Task Status</DialogTitle>
                      <DialogDescription>
                        {editingStatus ? "Update the task status details" : "Add a new custom task status to your workspace"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="status-name">Status Name</Label>
                        <Input
                          id="status-name"
                          placeholder="e.g., In Review, Testing, Blocked"
                          value={statusName}
                          onChange={(e) => setStatusName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status-category">Category</Label>
                        <Select value={statusCategory} onValueChange={setStatusCategory}>
                          <SelectTrigger id="status-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BACKLOG">Backlog</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="ON_HOLD">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status-color">Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="status-color"
                            type="color"
                            value={statusColor}
                            onChange={(e) => setStatusColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={statusColor}
                            onChange={(e) => setStatusColor(e.target.value)}
                            placeholder="#34D399"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={editingStatus ? handleUpdateStatus : handleCreateStatus}>
                        {editingStatus ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group statuses by category */}
                {["BACKLOG", "IN_PROGRESS", "COMPLETED", "ON_HOLD"].map((category) => {
                  const categoryStatuses = statuses.filter((s) => {
                    console.log(`Filtering status ${s.name} with category ${s.category} against ${category}`)
                    return s.category === category
                  })
                  console.log(`Category ${category} has ${categoryStatuses.length} statuses:`, categoryStatuses)
                  if (categoryStatuses.length === 0) return null

                  return (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
                        {category.replace("_", " ").toLowerCase()} ({categoryStatuses.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {categoryStatuses.map((status) => {
                          const isDefault = ["TODO", "IN_PROGRESS", "DONE"].includes(status.name)
                          return (
                            <Card key={status.id || status.name}>
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: status.color }}
                                  />
                                  <span className="font-medium capitalize">
                                    {status.name.replace("_", " ").toLowerCase()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {isDefault ? (
                                    <Badge variant="secondary">Default</Badge>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEditStatus(status)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleDeleteStatus(status.id, status.name)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>
                    Create custom tags to organize and categorize your tasks
                  </CardDescription>
                </div>
                <Dialog open={tagDialogOpen} onOpenChange={(open) => {
                  setTagDialogOpen(open)
                  if (!open) resetTagForm()
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingTag ? "Edit" : "Create"} Tag</DialogTitle>
                      <DialogDescription>
                        {editingTag ? "Update the tag details" : "Add a new tag to your workspace"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="tag-name">Tag Name</Label>
                        <Input
                          id="tag-name"
                          placeholder="e.g., Frontend, Backend, Urgent"
                          value={tagName}
                          onChange={(e) => setTagName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tag-color">Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="tag-color"
                            type="color"
                            value={tagColor}
                            onChange={(e) => setTagColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={tagColor}
                            onChange={(e) => setTagColor(e.target.value)}
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={editingTag ? handleUpdateTag : handleCreateTag}>
                        {editingTag ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tags.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No tags yet. Click "Add Tag" to create one.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tags.map((tag) => (
                      <Card key={tag.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="font-medium capitalize">{tag.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditTag(tag)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTag(tag.id, tag.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
