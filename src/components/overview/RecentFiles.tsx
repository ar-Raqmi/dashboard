'use client'

import { useMemo } from 'react'
import Icon, { type IconName } from '@/components/ui/Icon'
import { useAppStore, type FileItem } from '@/lib/store'
import { useUi } from '@/lib/ui'
import { useNavigate } from '@/hooks/useNavigate'
import { formatBytes, relativeTime } from '@/lib/dates'

export const FILE_ICON: Record<FileItem['category'], IconName> = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  pdf: 'file',
  doc: 'notes',
  folder: 'files',
  other: 'file',
}

export default function RecentFiles({ limit = 4 }: { limit?: number }) {
  const files = useAppStore((s) => s.files)
  const navigate = useNavigate()
  const setFileSearch = useUi((s) => s.setFileSearch)

  const recent = useMemo(
    () => files.filter((f) => f.type === 'file').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit),
    [files, limit],
  )

  return (
    <section className="recent-files">
      <div className="section-heading">
        <h2>Recent files</h2>
        <button className="icon-button compact" title="Open files" aria-label="Open files" onClick={() => navigate('files')}><Icon name="upRight" size={15} /></button>
      </div>
      {recent.length === 0 && <p className="muted-note">Files you upload will show up here.</p>}
      {recent.map((f) => (
        <button
          key={f.id}
          className="pinned-note"
          title={f.name}
          onClick={() => {
            setFileSearch(f.name)
            navigate('files')
          }}
        >
          <Icon name={FILE_ICON[f.category]} size={14} />
          <span>{f.name}</span>
          <small>{formatBytes(f.size)} · {relativeTime(f.updatedAt)}</small>
        </button>
      ))}
    </section>
  )
}
