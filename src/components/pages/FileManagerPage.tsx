'use client'

import React from 'react'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import FileManager from '@/components/file-manager/FileManager'
import FilePreview from '@/components/file-manager/FilePreview'
import { Button } from '@/components/ui/button'

export default function FileManagerPage() {
  const { currentFolderId, setCurrentFolderId, setActivePage } = useAppStore()

  return (
    <div className="flex flex-col h-full min-h-0 p-4 md:p-6 rounded-3xl bg-card border border-border/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (currentFolderId) {
              setCurrentFolderId(null)
            } else {
              setActivePage('dashboard')
            }
          }}
          className="rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent size-10 shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center shadow-sm">
            <FolderOpen className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Files</h1>
            <p className="text-xs text-muted-foreground">Manage your files and folders</p>
          </div>
        </div>
      </div>

      {/* File Manager */}
      <div className="flex-1 min-h-0">
        <FileManager />
      </div>

      {/* File Preview Modal */}
      <FilePreview />
    </div>
  )
}
