"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface TimeLog {
  id: string
  hoursSpent: number
  description: string | null
  logDate: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  task: {
    id: string
    title: string
    project: {
      id: string
      name: string
    }
  }
}

interface Project {
  id: string
  name: string
}

interface TimeLogsTableProps {
  timeLogs: TimeLog[]
  projects: Project[]
}

export function TimeLogsTable({ timeLogs, projects }: TimeLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")

  const filteredLogs = timeLogs.filter((log) => {
    const matchesSearch =
      log.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.task.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user.name && log.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesProject = selectedProject === "all" || log.task.project.id === selectedProject

    return matchesSearch && matchesProject
  })

  const totalHours = filteredLogs.reduce((sum, log) => sum + log.hoursSpent, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search time logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredLogs.length} log(s) • {totalHours.toFixed(1)} hours total
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm || selectedProject !== "all"
                    ? "No time logs found matching your filters."
                    : "No time logs yet. Start tracking time on your tasks!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{log.task.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.task.project.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={log.user.image || ""} />
                        <AvatarFallback className="text-xs">{log.user.name?.[0] || log.user.email[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{log.user.name || log.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{log.hoursSpent}h</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{log.description || "No description"}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.logDate), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
