import {
  Image as ImageIcon,
  Music,
  FileText,
  FileEdit,
  Film,
  File,
  Folder,
  type LucideIcon,
} from 'lucide-react'
import type { FileCategory } from '@/lib/store'

export interface FileCategoryConfig {
  label: string
  icon: LucideIcon
  iconClass: string
  chipClass: string
}

const CATEGORY_REGISTRY: Record<FileCategory, FileCategoryConfig> = {
  image: {
    label: 'Image',
    icon: ImageIcon,
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    chipClass: 'bg-emerald-500/10',
  },
  audio: {
    label: 'Audio',
    icon: Music,
    iconClass: 'text-purple-500 dark:text-purple-400',
    chipClass: 'bg-purple-500/10',
  },
  pdf: {
    label: 'PDF',
    icon: FileText,
    iconClass: 'text-red-500 dark:text-red-400',
    chipClass: 'bg-red-500/10',
  },
  doc: {
    label: 'Document',
    icon: FileEdit,
    iconClass: 'text-blue-500 dark:text-blue-400',
    chipClass: 'bg-blue-500/10',
  },
  video: {
    label: 'Video',
    icon: Film,
    iconClass: 'text-pink-500 dark:text-pink-400',
    chipClass: 'bg-pink-500/10',
  },
  folder: {
    label: 'Folder',
    icon: Folder,
    iconClass: 'text-amber-500 dark:text-amber-400',
    chipClass: 'bg-amber-500/10',
  },
  other: {
    label: 'File',
    icon: File,
    iconClass: 'text-muted-foreground',
    chipClass: 'bg-muted',
  },
}

export class FileCategoryService {
  static get(category: FileCategory): FileCategoryConfig {
    return CATEGORY_REGISTRY[category] ?? CATEGORY_REGISTRY.other
  }

  static label(category: FileCategory): string {
    return this.get(category).label
  }
}

export function resolveFileCategory(
  file: { type?: string; category?: FileCategory } | null | undefined,
): FileCategory {
  if (file?.type === 'folder') return 'folder'
  return (file?.category as FileCategory) || 'other'
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(1)} GB`
}

export function formatFileDate(ts?: number | string | null, withTime = false): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
