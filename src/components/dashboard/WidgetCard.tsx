'use client'

import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

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
}

// Grid size picker: shows a 3×3 visual grid where user clicks to select size
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
      <div className="grid grid-cols-3 gap-1.5" role="grid" aria-label="Select widget size">
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => {
            const w = col + 1
            const h = row + 1
            const isSelected = w <= currentW && h <= currentH
            const isCurrent = w === currentW && h === currentH
            return (
              <button
                key={`${w}-${h}`}
                onClick={() => onSizeChange(w, h)}
                className={cn(
                  'w-10 h-10 rounded-xl transition-all duration-200 border-2 flex items-center justify-center',
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
                <span className="text-[10px] font-bold leading-none">
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
}: WidgetCardProps) {
  const handleSizeChange = useCallback(
    (w: number, h: number) => {
      onSizeChange(w, h)
    },
    [onSizeChange]
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        mass: 0.8,
      }}
      className={cn(
        'widget-card rounded-3xl border border-border bg-card flex flex-col h-full overflow-hidden relative shadow-sm',
        className
      )}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        {/* Drag handle */}
        <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded-xl hover:bg-accent transition-colors">
          <GripVertical className="w-4 h-4 text-outline hover:text-primary transition-colors" />
        </div>

        {/* Icon + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-primary shrink-0">{icon}</span>
          <h3 className="text-sm font-semibold text-foreground truncate">
            {title}
          </h3>
        </div>

        {/* Size picker — uses Popover with Portal so it renders outside the card's overflow-hidden */}
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
          onNavigate && 'cursor-pointer'
        )}
        onClick={onNavigate}
        role={onNavigate ? 'button' : undefined}
        tabIndex={onNavigate ? 0 : undefined}
        onKeyDown={onNavigate ? (e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate() } : undefined}
      >
        {children}
      </div>
    </motion.div>
  )
}
