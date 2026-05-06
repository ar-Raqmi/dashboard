'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

// Grid size picker: shows a 3×3 visual grid where user clicks to select size
function GridSizePicker({
  currentW,
  currentH,
  onSizeChange,
  onClose,
}: {
  currentW: number
  currentH: number
  onSizeChange: (w: number, h: number) => void
  onClose: () => void
}) {
  return (
    <div className="p-2">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
        Grid Size
      </div>
      <div className="grid grid-cols-3 gap-1" role="grid" aria-label="Select widget size">
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => {
            const w = col + 1
            const h = row + 1
            const isSelected = w <= currentW && h <= currentH
            const isCurrent = w === currentW && h === currentH
            return (
              <button
                key={`${w}-${h}`}
                onClick={() => {
                  onSizeChange(w, h)
                  onClose()
                }}
                className={cn(
                  'w-8 h-8 rounded-lg transition-all duration-200 border-2 flex items-center justify-center',
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
      <div className="text-[10px] text-muted-foreground mt-2 px-1 text-center">
        {currentW}×{currentH}
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
}: WidgetCardProps) {
  const [showSizePicker, setShowSizePicker] = useState(false)

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

        {/* Size picker button */}
        <div className="relative">
          <button
            onClick={() => setShowSizePicker((prev) => !prev)}
            className={cn(
              'shrink-0 p-1.5 rounded-xl transition-all duration-200',
              showSizePicker
                ? 'bg-primary/15 text-primary'
                : 'hover:bg-accent text-muted-foreground hover:text-primary'
            )}
            aria-label={`Resize ${title}`}
            title={`${currentW}×${currentH} — click to resize`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Size picker popover */}
          <AnimatePresence>
            {showSizePicker && (
              <>
                {/* Backdrop to close */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSizePicker(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-popover shadow-lg shadow-black/10 dark:shadow-black/30"
                >
                  <GridSizePicker
                    currentW={currentW}
                    currentH={currentH}
                    onSizeChange={handleSizeChange}
                    onClose={() => setShowSizePicker(false)}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {children}
      </div>
    </motion.div>
  )
}
