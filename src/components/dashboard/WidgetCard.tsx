'use client'

import React, { useCallback } from 'react'
import { GripVertical, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { MAX_GRID_W, MAX_GRID_H } from '@/lib/store'

interface WidgetCardProps {
  title: string
  icon: React.ReactNode
  className?: string
  children: React.ReactNode
  onAction?: () => void
  actionIcon?: React.ReactNode
  widgetId: string
  currentW: number
  currentH: number
  onSizeChange: (w: number, h: number) => void
  onNavigate?: () => void
  editMode?: boolean
}

// Grid size picker: shows a W×H visual grid where user clicks to select size
function GridSizePicker({
  currentW,
  currentH,
  onSizeChange,
}: {
  currentW: number
  currentH: number
  onSizeChange: (w: number, h: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Grid Size
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${MAX_GRID_W}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Select widget size"
      >
        {Array.from({ length: MAX_GRID_H }, (_, row) =>
          Array.from({ length: MAX_GRID_W }, (_, col) => {
            const w = col + 1
            const h = row + 1
            const isSelected = w <= currentW && h <= currentH
            const isCurrent = w === currentW && h === currentH
            return (
              <button
                key={`${w}-${h}`}
                onClick={() => onSizeChange(w, h)}
                className={cn(
                  'w-10 h-8 rounded-lg transition-all duration-200 border-2 flex items-center justify-center',
                  'hover:scale-110 active:scale-95',
                  isCurrent
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : isSelected
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-muted/50 border-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/10'
                )}
                title={`${w}×${h}`}
                aria-label={`${w} columns by ${h} rows`}
                aria-pressed={isCurrent}
              >
                <span className="text-[9px] font-bold leading-none">
                  {w}×{h}
                </span>
              </button>
            )
          })
        )}
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Current: {currentW}×{currentH}
      </div>
    </div>
  )
}

export function WidgetCard({
  title,
  icon,
  className,
  children,
  onAction,
  actionIcon,
  widgetId,
  currentW,
  currentH,
  onSizeChange,
  onNavigate,
  editMode = false,
}: WidgetCardProps) {
  const handleSizeChange = useCallback(
    (w: number, h: number) => {
      onSizeChange(w, h)
    },
    [onSizeChange]
  )

  return (
    <div
      className={cn(
        'widget-card rounded-3xl border bg-card flex flex-col h-full overflow-hidden relative shadow-sm transition-shadow duration-200',
        editMode
          ? 'border-primary/40 shadow-md shadow-primary/5 ring-1 ring-primary/20'
          : 'border-border',
        className
      )}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        {/* Drag handle - only visible in edit mode */}
        {editMode && (
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded-xl hover:bg-accent transition-colors">
            <GripVertical className="w-4 h-4 text-primary/70 hover:text-primary transition-colors" />
          </div>
        )}

        {/* Icon + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-primary shrink-0">{icon}</span>
          <h3 className="text-sm font-semibold text-foreground truncate">
            {title}
          </h3>
        </div>

        {/* Size picker — only visible in edit mode, uses Popover with Portal */}
        {editMode && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="shrink-0 p-1.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
                aria-label={`Resize ${title}`}
                title={`${currentW}×${currentH} — click to resize`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="rounded-2xl p-4 w-auto"
            >
              <GridSizePicker
                currentW={currentW}
                currentH={currentH}
                onSizeChange={handleSizeChange}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Optional action */}
        {onAction && actionIcon && (
          <button
            onClick={onAction}
            className="shrink-0 p-1.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
            aria-label={`${title} action`}
          >
            {actionIcon}
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div
        className={cn(
          'flex-1 overflow-y-auto custom-scrollbar p-4',
          onNavigate && !editMode && 'cursor-pointer'
        )}
        onClick={editMode ? undefined : onNavigate}
        role={onNavigate && !editMode ? 'button' : undefined}
        tabIndex={onNavigate && !editMode ? 0 : undefined}
        onKeyDown={onNavigate && !editMode ? (e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate() } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
