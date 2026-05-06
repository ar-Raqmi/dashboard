'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  CheckCircle,
  StickyNote,
  File,
  Flag,
  Command,
} from 'lucide-react'
import { useAppStore, type ActivePage } from '@/lib/store'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'

// ===== TYPES =====
interface SearchResult {
  id: string
  name: string
  type: 'task' | 'note' | 'file' | 'goal'
  badge: string
  page: ActivePage
}

// ===== ICONS BY TYPE =====
const getTypeIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'task': return <CheckCircle className="size-4 text-primary" />
    case 'note': return <StickyNote className="size-4 text-secondary" />
    case 'file': return <File className="size-4 text-blue-400" />
    case 'goal': return <Flag className="size-4 text-amber-400" />
  }
}

const getTypeBadgeColor = (type: SearchResult['type']): string => {
  switch (type) {
    case 'task': return 'bg-primary/20 text-primary'
    case 'note': return 'bg-secondary/20 text-secondary'
    case 'file': return 'bg-blue-500/20 text-blue-400'
    case 'goal': return 'bg-amber-500/20 text-amber-400'
  }
}

// ===== MAIN GLOBAL SEARCH =====
export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const { tasks, notes, files, goals, setActivePage, searchQuery, setSearchQuery } = useAppStore()

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Build search results
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return { tasks: [], notes: [], files: [], goals: [] }

    const filteredTasks: SearchResult[] = tasks
      .filter(t => t.title.toLowerCase().includes(q))
      .map(t => ({
        id: t.id,
        name: t.title,
        type: 'task' as const,
        badge: t.status === 'completed' ? 'Done' : 'Pending',
        page: 'tasks' as ActivePage,
      }))

    const filteredNotes: SearchResult[] = notes
      .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .map(n => ({
        id: n.id,
        name: n.title,
        type: 'note' as const,
        badge: 'Note',
        page: 'notes' as ActivePage,
      }))

    const filteredFiles: SearchResult[] = files
      .filter(f => f.name.toLowerCase().includes(q))
      .map(f => ({
        id: f.id,
        name: f.name,
        type: 'file' as const,
        badge: f.category,
        page: 'files' as ActivePage,
      }))

    const filteredGoals: SearchResult[] = goals
      .filter(g => g.title.toLowerCase().includes(q))
      .map(g => ({
        id: g.id,
        name: g.title,
        type: 'goal' as const,
        badge: `${g.progress}%`,
        page: 'goals' as ActivePage,
      }))

    return {
      tasks: filteredTasks,
      notes: filteredNotes,
      files: filteredFiles,
      goals: filteredGoals,
    }
  }, [searchQuery, tasks, notes, files, goals])

  const hasResults = searchResults.tasks.length > 0 || searchResults.notes.length > 0 ||
    searchResults.files.length > 0 || searchResults.goals.length > 0

  const handleSelect = (result: SearchResult) => {
    setActivePage(result.page)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setSearchQuery('')
      }}
      title="Search ar-Raqmi Database"
      description="Search across tasks, notes, files, and goals"
      className="bg-card border-border text-foreground rounded-3xl"
    >
      <CommandInput
        placeholder="Search tasks, notes, files, goals..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="text-foreground"
      />
      <CommandList className="max-h-80">
        {!searchQuery.trim() ? (
          <div className="py-12 flex flex-col items-center gap-3 text-outline">
            <Search className="size-8 opacity-50" />
            <p className="text-sm">Start typing to search...</p>
          </div>
        ) : !hasResults ? (
          <CommandEmpty className="text-outline">No results found</CommandEmpty>
        ) : (
          <>
            {searchResults.tasks.length > 0 && (
              <CommandGroup heading="Tasks" className="[&_[cmdk-group-heading]]:text-primary">
                {searchResults.tasks.map(result => (
                  <CommandItem
                    key={result.id}
                    value={`task-${result.name}`}
                    onSelect={() => handleSelect(result)}
                    className="text-foreground/80 hover:bg-accent data-[selected=true]:bg-accent cursor-pointer rounded-2xl"
                  >
                    {getTypeIcon(result.type)}
                    <span className="flex-1 truncate">{result.name}</span>
                    <Badge className={`${getTypeBadgeColor(result.type)} border-0 rounded-2xl text-[10px]`}>
                      {result.badge}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults.notes.length > 0 && (
              <CommandGroup heading="Notes" className="[&_[cmdk-group-heading]]:text-secondary">
                {searchResults.notes.map(result => (
                  <CommandItem
                    key={result.id}
                    value={`note-${result.name}`}
                    onSelect={() => handleSelect(result)}
                    className="text-foreground/80 hover:bg-accent data-[selected=true]:bg-accent cursor-pointer rounded-2xl"
                  >
                    {getTypeIcon(result.type)}
                    <span className="flex-1 truncate">{result.name}</span>
                    <Badge className={`${getTypeBadgeColor(result.type)} border-0 rounded-2xl text-[10px]`}>
                      {result.badge}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults.files.length > 0 && (
              <CommandGroup heading="Files" className="[&_[cmdk-group-heading]]:text-blue-400">
                {searchResults.files.map(result => (
                  <CommandItem
                    key={result.id}
                    value={`file-${result.name}`}
                    onSelect={() => handleSelect(result)}
                    className="text-foreground/80 hover:bg-accent data-[selected=true]:bg-accent cursor-pointer rounded-2xl"
                  >
                    {getTypeIcon(result.type)}
                    <span className="flex-1 truncate">{result.name}</span>
                    <Badge className={`${getTypeBadgeColor(result.type)} border-0 rounded-2xl text-[10px]`}>
                      {result.badge}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults.goals.length > 0 && (
              <CommandGroup heading="Goals" className="[&_[cmdk-group-heading]]:text-amber-400">
                {searchResults.goals.map(result => (
                  <CommandItem
                    key={result.id}
                    value={`goal-${result.name}`}
                    onSelect={() => handleSelect(result)}
                    className="text-foreground/80 hover:bg-accent data-[selected=true]:bg-accent cursor-pointer rounded-2xl"
                  >
                    {getTypeIcon(result.type)}
                    <span className="flex-1 truncate">{result.name}</span>
                    <Badge className={`${getTypeBadgeColor(result.type)} border-0 rounded-2xl text-[10px]`}>
                      {result.badge}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
      {/* Footer hint */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 text-xs text-outline">
        <span>Navigate to item on select</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-outline text-[10px]">
            <Command className="size-2.5 inline" />K
          </kbd>
          <span>to toggle</span>
        </div>
      </div>
    </CommandDialog>
  )
}

// ===== SEARCH TRIGGER BUTTON =====
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-muted/50 hover:bg-accent border border-border/50 hover:border-border transition-all text-muted-foreground hover:text-foreground/60 text-sm w-full sm:w-64"
    >
      <Search className="size-4" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted text-outline text-[10px]">
        <Command className="size-2.5" />K
      </kbd>
    </button>
  )
}
