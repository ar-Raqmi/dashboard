'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Circle, Plus, Calendar } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'

const priorityColors: Record<string, string> = {
  high: 'bg-[oklch(0.8_0.08_350)]',
  medium: 'bg-[oklch(0.8_0.12_80)]',
  low: 'bg-[oklch(0.72_0.19_142)]',
}

export default function DailyTasksWidget() {
  const { tasks, addTask, toggleTaskStatus, setActivePage } = useAppStore()
  const [quickAdd, setQuickAdd] = useState('')

  const todayDate = new Date()
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
  const todaysTasks = tasks.filter(
    (t) => t.dueDate === today || t.status === 'pending'
  )
  const visibleTasks = todaysTasks.slice(0, 5)

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const title = quickAdd.trim()
    if (!title) return
    addTask({
      title,
      dueDate: today,
      priority: 'medium',
      status: 'pending',
    })
    setQuickAdd('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="mb-3">
        <div className="flex items-center gap-2">
          <Input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            placeholder="Add a task..."
            className="h-8 text-xs bg-[oklch(0.17_0.008_155)] border-[oklch(0.25_0.01_155)] rounded-xl placeholder:text-[oklch(0.5_0.01_155)] focus-visible:ring-[oklch(0.72_0.19_142)/30]"
          />
          <button
            type="submit"
            className="shrink-0 w-8 h-8 rounded-xl bg-[oklch(0.72_0.19_142)] flex items-center justify-center text-[oklch(0.17_0.008_155)] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-64 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {visibleTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[oklch(0.17_0.008_155)] hover:bg-[oklch(0.2_0.01_155)] transition-colors cursor-pointer group ${
                task.status === 'completed' ? 'opacity-50' : ''
              }`}
              onClick={() => toggleTaskStatus(task.id)}
            >
              {/* Checkbox */}
              {task.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.19_142)] shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[oklch(0.4_0.01_155)] shrink-0 group-hover:text-[oklch(0.6_0.01_155)]" />
              )}

              {/* Title */}
              <span
                className={`flex-1 text-xs font-medium truncate ${
                  task.status === 'completed'
                    ? 'line-through text-[oklch(0.5_0.01_155)]'
                    : 'text-[oklch(0.9_0.005_155)]'
                }`}
              >
                {task.title}
              </span>

              {/* Priority Badge */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[task.priority]}`}
              />

              {/* Due Date */}
              {task.dueDate && (
                <span className="flex items-center gap-1 text-[10px] text-[oklch(0.5_0.01_155)] shrink-0">
                  <Calendar className="w-2.5 h-2.5" />
                  {task.dueDate === today
                    ? 'Today'
                    : new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All */}
      {todaysTasks.length > 5 && (
        <button
          onClick={() => setActivePage('tasks')}
          className="mt-2 text-xs text-[oklch(0.72_0.19_142)] hover:underline text-center"
        >
          View All
        </button>
      )}
    </div>
  )
}
