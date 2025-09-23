"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
}

interface ProjectMemberSelectProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function ProjectMemberSelect({ value, onChange }: ProjectMemberSelectProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users")
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const selectedUsers = users.filter((user) => value.includes(user.id))

  const handleSelect = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId))
    } else {
      onChange([...value, userId])
    }
  }

  const handleRemove = (userId: string) => {
    onChange(value.filter((id) => id !== userId))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
          >
            {value.length === 0 ? "Select team members..." : `${value.length} member(s) selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>{loading ? "Loading users..." : "No users found."}</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem key={user.id} value={user.email} onSelect={() => handleSelect(user.id)}>
                    <Check className={cn("mr-2 h-4 w-4", value.includes(user.id) ? "opacity-100" : "opacity-0")} />
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

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="text-xs">{user.name?.[0] || user.email[0]}</AvatarFallback>
              </Avatar>
              {user.name || user.email}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
