"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Clock, User, FolderOpen, CheckSquare, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  type: "task" | "project" | "user"
  title: string
  description?: string
  status?: string
  project?: {
    id: string
    title: string
  }
  assignee?: {
    id: string
    name: string
  }
  owner?: {
    id: string
    name: string
  }
  role?: string
  organization?: {
    id: string
    name: string
  }
  workspace?: {
    id: string
    name: string
  }
  taskCount?: number
  createdAt: string
  url: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent-searches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex])
      }
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem("recent-searches", JSON.stringify(newRecent))

    // Navigate to result
    router.push(result.url)
    onOpenChange(false)
    setQuery("")
    setResults([])
  }

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4" />
      case "project":
        return <FolderOpen className="h-4 w-4" />
      case "user":
        return <User className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "DONE":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg font-semibold">Search</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              placeholder="Search tasks, projects, users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-4"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Results */}
          {query && (
            <div className="mt-4 max-h-[400px] overflow-y-auto">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                        index === selectedIndex
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex-shrink-0 text-muted-foreground">
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm truncate">
                            {result.title}
                          </h4>
                          {result.status && (
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getStatusColor(result.status))}
                            >
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        
                        {result.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {result.project && (
                            <span className="text-xs text-muted-foreground">
                              Project: {result.project.title}
                            </span>
                          )}
                          {result.assignee && (
                            <span className="text-xs text-muted-foreground">
                              Assigned to: {result.assignee.name}
                            </span>
                          )}
                          {result.owner && (
                            <span className="text-xs text-muted-foreground">
                              Owner: {result.owner.name}
                            </span>
                          )}
                          {result.organization && (
                            <span className="text-xs text-muted-foreground">
                              {result.organization.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 text-xs text-muted-foreground">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent searches</h4>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => handleRecentSearch(search)}
                  >
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard shortcuts */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
              <span>⌘K to open search</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
