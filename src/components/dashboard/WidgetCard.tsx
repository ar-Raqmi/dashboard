'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WidgetCardProps {
  title: string
  icon: React.ReactNode
  className?: string
  children: React.ReactNode
  onAction?: () => void
  actionIcon?: React.ReactNode
}

export function WidgetCard({
  title,
  icon,
  className,
  children,
  onAction,
  actionIcon,
}: WidgetCardProps) {
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
