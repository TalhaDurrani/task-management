"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface TaskAssigneeSelectProps {
  projectId: string
  value?: string
  onChange: (value: string) => void
}

export function TaskAssigneeSelect({ projectId, value, onChange }: TaskAssigneeSelectProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (response.ok) {
          const project = await response.json()
          const members = [project.owner, ...project.members.map((m: any) => m.user)]
          setUsers(members)
        }
      } catch (error) {
        console.error("Failed to fetch project members:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectMembers()
  }, [projectId])

  const selectedUser = users.find((user) => user.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          {selectedUser ? (
            <div className="flex items-center space-x-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedUser.image || ""} />
                <AvatarFallback className="text-xs">{selectedUser.name?.[0] || selectedUser.email[0]}</AvatarFallback>
              </Avatar>
              <span>{selectedUser.name || selectedUser.email}</span>
            </div>
          ) : (
            "Select assignee..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search team members..." />
          <CommandList>
            <CommandEmpty>{loading ? "Loading members..." : "No members found."}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="unassigned"
                onSelect={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                Unassigned
              </CommandItem>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.email}
                  onSelect={() => {
                    onChange(user.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === user.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="text-xs">{user.name?.[0] || user.email[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
