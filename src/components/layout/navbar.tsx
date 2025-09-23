"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { SearchDialog } from "@/components/search/search-dialog"
import { 
  Settings, 
  LogOut, 
  Search, 
  Command,
  HelpCircle,
  Zap,
  Menu,
  X
} from "lucide-react"
// Remove old hardcoded auth import

export function Navbar() {
  const { user: currentUser, isLoading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    router.push("/auth/signin")
  }

  const handleCommandPalette = () => {
    // TODO: Implement command palette
    console.log("Command palette clicked")
  }

  const handleHelp = () => {
    // TODO: Implement help functionality
    console.log("Help clicked")
  }

  const handleSettings = () => {
    // TODO: Implement settings functionality
    console.log("Settings clicked")
  }

  const handleKeyboardShortcuts = () => {
    // TODO: Implement keyboard shortcuts modal
    console.log("Keyboard shortcuts clicked")
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    if (query.trim()) {
      setIsSearchOpen(true)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      // Escape to close search
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="lg:hidden mr-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <div className="flex flex-1 items-center justify-between">
          {/* Left side - Logo and Search */}
          <div className="flex items-center space-x-4">
            {/* Logo - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <Zap className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">TaskFlow</span>
            </div>

            {/* Search - Desktop */}
            <div className="relative hidden lg:block">
              <Button
                variant="outline"
                className="w-80 justify-start text-muted-foreground"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Search tasks, projects, or people...
                <div className="ml-auto">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </Button>
            </div>
          </div>

          {/* Right side - Actions and User Menu */}
          <div className="flex items-center space-x-1">
            {/* Search - Mobile */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>

            {/* Command Palette - Desktop */}
            <Button variant="ghost" size="sm" className="hidden xl:flex" onClick={handleCommandPalette}>
              <Command className="mr-2 h-4 w-4" />
              <span className="hidden 2xl:inline">Command</span>
            </Button>

            {/* Notifications */}
            <div className="relative">
              <NotificationDropdown />
            </div>

            {/* Help - Desktop */}
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={handleHelp}>
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.image || ""} alt={currentUser?.name || ""} />
                      <AvatarFallback>{currentUser?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" sideOffset={5}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {currentUser?.role}
                        </Badge>
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleKeyboardShortcuts}>
                    <Zap className="mr-2 h-4 w-4" />
                    <span>Keyboard Shortcuts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="px-4 py-3 space-y-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                name="search"
                type="text"
                placeholder="Search tasks, projects, or people..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </form>
            
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={handleCommandPalette}>
                <Command className="mr-2 h-4 w-4" />
                Command Palette
              </Button>
              <Button variant="ghost" size="sm" onClick={handleHelp}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  )
}
