'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Flag, CheckCircle2, Circle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

export default function GoalsPage() {
  const { goals, addGoal, deleteGoal, toggleMilestone } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [milestoneInput, setMilestoneInput] = useState('')
  const [milestones, setMilestones] = useState<string[]>([])

  const handleAddMilestone = () => {
    if (!milestoneInput.trim()) return
    setMilestones([...milestones, milestoneInput.trim()])
    setMilestoneInput('')
  }

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleAddGoal = () => {
    if (!goalTitle.trim() || milestones.length === 0) return
    addGoal({
      title: goalTitle.trim(),
      progress: 0,
      milestones: milestones.map((label, i) => ({
        id: `m-${Date.now()}-${i}`,
        label,
        completed: false,
      })),
    })
    setGoalTitle('')
    setMilestones([])
    setMilestoneInput('')
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[oklch(0.72_0.19_142_/_0.15)]">
            <Flag className="size-6 text-[oklch(0.72_0.19_142)]" />
          </div>
          <h1 className="text-2xl font-bold">Goals</h1>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)]">
              <Plus className="size-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-[oklch(0.96_0.005_155)]">Add New Goal</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Goal Title</label>
                <Input
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Enter goal title..."
                  className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[oklch(0.75_0.01_155)]">Milestones</label>
                <div className="flex gap-2">
                  <Input
                    value={milestoneInput}
                    onChange={(e) => setMilestoneInput(e.target.value)}
                    placeholder="Add milestone..."
                    className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddMilestone()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-[oklch(0.28_0.01_155)] shrink-0"
                    onClick={handleAddMilestone}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {milestones.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    {milestones.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-xl bg-[oklch(0.22_0.008_155)] text-sm"
                      >
                        <span className="text-[oklch(0.72_0.19_142)] text-xs font-mono">{i + 1}.</span>
                        <span className="flex-1 text-[oklch(0.96_0.005_155)]">{m}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 rounded-lg text-[oklch(0.65_0.2_25)] hover:text-[oklch(0.7_0.2_25)]"
                          onClick={() => handleRemoveMilestone(i)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" className="rounded-2xl">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAddGoal}
                disabled={!goalTitle.trim() || milestones.length === 0}
                className="rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)] disabled:opacity-50"
              >
                Add Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Goals List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="p-4 rounded-3xl bg-[oklch(0.22_0.008_155)]">
                <Flag className="size-12 text-[oklch(0.75_0.01_155)]" />
              </div>
              <p className="text-[oklch(0.65_0.01_155)] text-center">
                No goals yet. Set your first goal!
              </p>
            </motion.div>
          ) : (
            goals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-5 flex flex-col gap-4"
              >
                {/* Goal Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[oklch(0.96_0.005_155)] text-lg">
                    {goal.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[oklch(0.72_0.19_142)]">
                      {goal.progress}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl text-[oklch(0.65_0.2_25)] hover:text-[oklch(0.7_0.2_25)] hover:bg-[oklch(0.65_0.2_25_/_0.1)]"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-[oklch(0.22_0.008_155)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[oklch(0.72_0.19_142)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Milestones */}
                <div className="flex flex-col gap-1.5">
                  {goal.milestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[oklch(0.22_0.008_155)] transition-colors text-left w-full"
                      onClick={() => toggleMilestone(goal.id, milestone.id)}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="size-5 text-[oklch(0.72_0.19_142)] shrink-0" />
                      ) : (
                        <Circle className="size-5 text-[oklch(0.38_0.01_155)] shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          milestone.completed
                            ? 'line-through text-[oklch(0.5_0.01_155)]'
                            : 'text-[oklch(0.96_0.005_155)]'
                        }`}
                      >
                        {milestone.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
