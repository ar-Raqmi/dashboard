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
        'widget-card rounded-3xl border border-[oklch(0.28_0.01_155)] bg-[oklch(0.17_0.008_155)] flex flex-col h-full overflow-hidden relative',
        className
      )}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[oklch(0.28_0.01_155)]/50">
        {/* Drag handle */}
        <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded-lg hover:bg-[oklch(0.22_0.02_142)] transition-colors">
          <GripVertical className="w-4 h-4 text-[oklch(0.38_0.01_155)] hover:text-[oklch(0.72_0.19_142)] transition-colors" />
        </div>

        {/* Icon + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[oklch(0.72_0.19_142)] shrink-0">{icon}</span>
          <h3 className="text-sm font-semibold text-[oklch(0.96_0.005_155)] truncate">
            {title}
          </h3>
        </div>

        {/* Optional action */}
        {onAction && actionIcon && (
          <button
            onClick={onAction}
            className="shrink-0 p-1.5 rounded-xl hover:bg-[oklch(0.22_0.02_142)] transition-colors text-[oklch(0.65_0.01_155)] hover:text-[oklch(0.72_0.19_142)]"
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
