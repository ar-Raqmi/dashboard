'use client'

import React, { useCallback } from 'react'
import { GripVertical, Maximize2, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { MAX_GRID_W, MAX_GRID_H, type EditSubMode } from '@/lib/store'

interface WidgetCardProps {
  title: string
  icon: React.ReactNode
  className?: string
  children: React.ReactNode
  onAction?: () => void
  actionIcon?: React.ReactNode
  headerAction?: React.ReactNode
  widgetId: string
  currentW: number
  currentH: number
  onSizeChange: (w: number, h: number) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onNavigate?: () => void
  editMode?: boolean
  editSubMode?: EditSubMode
  isMobile?: boolean
}

// Grid size picker: shows a W×H visual grid where user clicks to select size
function GridSizePicker({
  currentW,
  currentH,
  onSizeChange,
  isMobile,
}: {
  currentW: number
  currentH: number
  onSizeChange: (w: number, h: number) => void
  isMobile?: boolean
}) {
  const maxW = isMobile ? 1 : MAX_GRID_W
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Grid Size
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${maxW}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Select widget size"
      >
        {Array.from({ length: MAX_GRID_H }, (_, row) =>
          Array.from({ length: maxW }, (_, col) => {
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
  headerAction,
  widgetId,
  currentW,
  currentH,
  onSizeChange,
  onMoveUp,
  onMoveDown,
  onNavigate,
  editMode = false,
  editSubMode = 'move',
  isMobile = false,
}: WidgetCardProps) {
  const handleSizeChange = useCallback(
    (w: number, h: number) => {
      onSizeChange(w, h)
    },
    [onSizeChange]
  )

  return (
    <div
      onPointerDown={(e) => {
        // Only block on desktop if needed, on mobile we don't drag at all now
        if (!isMobile && editMode) {
          const isDragHandle = !!(e.target as HTMLElement).closest('.widget-drag-handle')
          if (!isDragHandle) e.stopPropagation()
        }
      }}
      className={cn(
        'widget-card group rounded-3xl border bg-card flex flex-col h-full overflow-hidden relative transition-shadow duration-200',
        editMode ? 'border-primary/40 shadow-md shadow-primary/5 ring-1 ring-primary/20' : 'border-border shadow-sm hover:shadow-md hover:border-primary/20',
        // Definitively block dragging on mobile to allow button clicks
        isMobile && 'no-drag'
      )}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        {/* Desktop Drag Handle */}
        {editMode && !isMobile && (
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-2 -ml-2 mr-1 rounded-xl hover:bg-accent transition-colors shrink-0">
            <GripVertical className="w-4 h-4 text-primary/70 hover:text-primary transition-colors" />
          </div>
        )}

        {/* Mobile Move Buttons */}
        {editMode && isMobile && editSubMode === 'move' && (
          <div className="flex items-center gap-1 -ml-2 mr-1">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}
              className="p-2 rounded-xl hover:bg-accent text-primary transition-colors no-drag"
              aria-label="Move up"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}
              className="p-2 rounded-xl hover:bg-accent text-primary transition-colors no-drag"
              aria-label="Move down"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Icon + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-primary shrink-0">{icon}</span>
          <h3 className="text-sm font-semibold text-foreground truncate">
            {title}
          </h3>
        </div>

        {/* Custom header action (e.g. settings popover) */}
        {headerAction && (
          <div 
            className={cn(
              'shrink-0 transition-opacity duration-200 no-drag',
              editMode
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            )}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {headerAction}
          </div>
        )}

        {/* Size picker — visible in edit mode, but on mobile only in 'resize' sub-mode */}
        {editMode && (!isMobile || editSubMode === 'resize') && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="shrink-0 p-2 sm:p-1.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-primary no-drag"
                aria-label={`Resize ${title}`}
                title={`${currentW}×${currentH} — click to resize`}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Maximize2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
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
                isMobile={isMobile}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Optional action */}
        {onAction && actionIcon && (
          <button
            onClick={onAction}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 p-2 sm:p-1.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-primary no-drag"
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
