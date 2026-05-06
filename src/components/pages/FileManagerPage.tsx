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
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
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
          className="rounded-2xl text-white/60 hover:text-white hover:bg-white/10 size-9"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-[oklch(0.72_0.19_142)]/20 flex items-center justify-center">
            <FolderOpen className="size-5 text-[oklch(0.72_0.19_142)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Files</h1>
            <p className="text-xs text-white/40">Manage your files and folders</p>
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
