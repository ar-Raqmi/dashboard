'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, CheckCircle2, Circle } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function GoalsWidget() {
  const { goals, setActivePage } = useAppStore()

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [goals])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <Target className="w-3.5 h-3.5 text-[oklch(0.72_0.19_142)]" />
        <span className="text-[10px] uppercase tracking-wider text-[oklch(0.5_0.01_155)] font-semibold">
          Goals
        </span>
      </div>

      {/* Goals List */}
      <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        {sortedGoals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="p-3 rounded-2xl bg-[oklch(0.17_0.008_155)] hover:bg-[oklch(0.2_0.01_155)] transition-colors"
          >
            {/* Title + Percentage */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-[oklch(0.9_0.005_155)] truncate flex-1 mr-2">
                {goal.title}
              </h4>
              <span className="text-[10px] font-bold text-[oklch(0.72_0.19_142)] shrink-0">
                {goal.progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-[oklch(0.13_0.008_155)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-[oklch(0.72_0.19_142)]"
              />
            </div>

            {/* Milestones List - Vertically stacked to show all */}
            <div className="flex flex-col gap-1.5 mt-3">
              {goal.milestones.map((ms) => (
                <div key={ms.id} className="flex items-start gap-2 group/ms" title={ms.label}>
                  {ms.completed ? (
                    <CheckCircle2 className="w-2.5 h-2.5 mt-0.5 text-[oklch(0.72_0.19_142)] shrink-0" />
                  ) : (
                    <Circle className="w-2.5 h-2.5 mt-0.5 text-[oklch(0.35_0.01_155)] shrink-0" />
                  )}
                  <span
                    className={`text-[10px] leading-tight ${
                      ms.completed
                        ? 'text-[oklch(0.5_0.01_155)] line-through'
                        : 'text-[oklch(0.7_0.005_155)]'
                    }`}
                  >
                    {ms.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        {sortedGoals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 opacity-50">
            <Target className="size-8 mb-2 text-[oklch(0.35_0.01_155)]" />
            <p className="text-[10px] uppercase tracking-widest">No goals set</p>
          </div>
        )}
      </div>

      {/* View All */}
      <button
        onClick={() => setActivePage('goals')}
        className="mt-2 text-[10px] text-[oklch(0.72_0.19_142)] hover:underline text-center font-medium"
      >
        View All Goals →
      </button>
    </div>
  )
}
