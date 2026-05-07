'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, CalendarDays, StickyNote, BookOpen, Flag, Clock, Folder, ClipboardList } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import type { WidgetType } from '@/lib/store'

// Widget icon mapping
const widgetIconMap: Record<WidgetType, React.ReactNode> = {
  tasks: <CheckCircle className="w-5 h-5" />,
  calendar: <CalendarDays className="w-5 h-5" />,
  notes: <StickyNote className="w-5 h-5" />,
  verse: <BookOpen className="w-5 h-5" />,
  goals: <Flag className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  files: <Folder className="w-5 h-5" />,
  clipboard: <ClipboardList className="w-5 h-5" />,
}

export function DashboardManager() {
  const showDashboardManager = useAppStore((s) => s.showDashboardManager)
  const setShowDashboardManager = useAppStore((s) => s.setShowDashboardManager)
  const widgets = useAppStore((s) => s.widgets)
  const toggleWidgetVisibility = useAppStore((s) => s.toggleWidgetVisibility)

  return (
    <Sheet
      open={showDashboardManager}
      onOpenChange={setShowDashboardManager}
    >
      <SheetContent
        side="right"
        className="bg-background border-l border-border w-80 sm:max-w-sm"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-foreground text-lg font-bold">
            Dashboard Widgets
          </SheetTitle>
        </SheetHeader>

        <p className="text-xs text-muted-foreground px-4 -mt-1 mb-4">
          Hidden widgets are still accessible via navigation tabs
        </p>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1">
          <AnimatePresence mode="popLayout">
            {widgets.map((widget) => (
              <motion.div
                key={widget.type}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-accent transition-colors group"
              >
                {/* Icon + Label */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={
                      widget.visible
                        ? 'text-primary'
                        : 'text-outline'
                    }
                  >
                    {widgetIconMap[widget.type]}
                  </span>
                  <span
                    className={
                      widget.visible
                        ? 'text-sm font-medium text-foreground'
                        : 'text-sm font-medium text-muted-foreground'
                    }
                  >
                    {widget.label}
                  </span>
                </div>

                {/* Toggle Switch */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidgetVisibility(widget.type)}
                    className={
                      widget.visible
                        ? 'data-[state=checked]:bg-primary'
                        : ''
                    }
                  />
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <div className="mt-auto pt-4 px-4 border-t border-border/50">
          <p className="text-[10px] text-outline text-center">
            Drag widgets on the dashboard to rearrange them
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
