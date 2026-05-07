'use client'

import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { 
  Folder, File, Upload, FolderPlus, ArrowLeft, MoreVertical, 
  Trash2, FileText, ImageIcon, Music, Film, FileEdit, Loader2, Check, X 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function FileManager() {
  const { sessionToken } = useAuth()
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const files = useQuery(api.files.list, sessionToken ? { sessionToken, parentId: currentFolderId } : 'skip')
  const createFile = useMutation(api.files.createFile)
  const deleteFile = useMutation(api.files.remove)

  const handleCreateFolder = async () => {
    if (!sessionToken || !newFolderName) return
    await createFile({
      sessionToken,
      name: newFolderName,
      type: 'folder',
      parentId: currentFolderId,
    })
    setNewFolderName('')
  }

  const handleDelete = async (id: string) => {
    if (!sessionToken) return
    await deleteFile({ sessionToken, id })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Files</h2>
        <div className="flex items-center gap-2">
          {currentFolderId && <Button variant="ghost" onClick={() => setCurrentFolderId(undefined)}><ArrowLeft className="size-4 mr-2" /> Back</Button>}
          <Button onClick={() => setShowUploadModal(true)}><Upload className="size-4 mr-2" /> Upload</Button>
          <div className="flex items-center gap-2">
            <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
            <Button onClick={handleCreateFolder} variant="outline"><FolderPlus className="size-4" /></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {files?.map(file => (
          <div key={file._id} className="p-4 border rounded-2xl flex flex-col items-center hover:bg-muted/50 cursor-pointer">
            {file.type === 'folder' ? (
              <Folder className="size-12 text-primary mb-2" onClick={() => setCurrentFolderId(file._id)} />
            ) : (
              <File className="size-12 text-muted-foreground mb-2" />
            )}
            <p className="text-sm font-medium truncate w-full text-center">{file.name}</p>
            <DropdownMenu>
              <DropdownMenuTrigger><MoreVertical className="size-4" /></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDelete(file._id)} className="text-destructive">
                  <Trash2 className="size-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} folderId={currentFolderId} />
    </div>
  )
}

function UploadModal({ open, onClose, folderId }: { open: boolean, onClose: () => void, folderId: string | undefined }) {
  const { sessionToken } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveFile = useMutation(api.files.createFile)

  const handleUpload = async () => {
    if (!file || !sessionToken) return
    setUploading(true)
    setProgress(30)
    const url = await generateUploadUrl()
    const result = await fetch(url, { method: 'POST', body: file })
    const { storageId } = await result.json()
    setProgress(70)
    await saveFile({
      sessionToken,
      name: file.name,
      type: 'file',
      storageId,
      parentId: folderId,
      size: file.size,
    })
    setProgress(100)
    setUploading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {uploading && <div className="h-2 bg-primary" style={{ width: `${progress}%` }} />}
        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
