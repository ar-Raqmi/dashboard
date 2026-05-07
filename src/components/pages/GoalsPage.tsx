'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Flag, CheckCircle2, Circle, Pencil } from 'lucide-react'
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
  const { goals, addGoal, deleteGoal, updateGoal, toggleMilestone } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [goalTitle, setGoalTitle] = useState('')
  const [milestoneInput, setMilestoneInput] = useState('')
  const [milestones, setMilestones] = useState<{ id: string; label: string; completed: boolean }[]>([])

  const handleAddMilestone = () => {
    if (!milestoneInput.trim()) return
    setMilestones([
      ...milestones,
      {
        id: `temp-${Date.now()}-${milestones.length}`,
        label: milestoneInput.trim(),
        completed: false,
      },
    ])
    setMilestoneInput('')
  }

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleAddGoal = () => {
    if (!goalTitle.trim() || milestones.length === 0) return
    
    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: goalTitle.trim(),
        milestones: milestones.map((m) => ({
          id: m.id,
          label: m.label,
          completed: m.completed,
        })),
      })
    } else {
      addGoal({
        title: goalTitle.trim(),
        progress: 0,
        milestones: milestones.map((m, i) => ({
          id: `m-${Date.now()}-${i}`,
          label: m.label,
          completed: m.completed,
        })),
      })
    }
    
    resetForm()
    setDialogOpen(false)
  }

  const resetForm = () => {
    setGoalTitle('')
    setMilestones([])
    setMilestoneInput('')
    setEditingGoal(null)
  }

  const handleEditClick = (goal: any) => {
    setEditingGoal(goal)
    setGoalTitle(goal.title)
    setMilestones(goal.milestones.map((m: any) => ({ ...m })))
    setDialogOpen(true)
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
          <div className="p-2 rounded-2xl bg-primary/15">
            <Flag className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Goals</h1>
        </div>

        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-on-surface-variant">Goal Title</label>
                <Input
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Enter goal title..."
                  className="rounded-2xl bg-input border-border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-on-surface-variant">Milestones</label>
                <div className="flex gap-2">
                  <Input
                    value={milestoneInput}
                    onChange={(e) => setMilestoneInput(e.target.value)}
                    placeholder="Add milestone..."
                    className="rounded-2xl bg-input border-border"
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
                    className="rounded-2xl border-border shrink-0"
                    onClick={handleAddMilestone}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {milestones.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
                    {milestones.map((m, i) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-muted text-sm"
                      >
                        <span className="text-primary text-xs font-mono">{i + 1}.</span>
                        <Input
                          value={m.label}
                          onChange={(e) => {
                            const newMilestones = [...milestones]
                            newMilestones[i] = { ...newMilestones[i], label: e.target.value }
                            setMilestones(newMilestones)
                          }}
                          className="flex-1 bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-foreground"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 rounded-lg text-destructive hover:text-destructive"
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
                className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {editingGoal ? 'Save Changes' : 'Add Goal'}
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
              <div className="p-4 rounded-3xl bg-muted">
                <Flag className="size-12 text-on-surface-variant" />
              </div>
              <p className="text-muted-foreground text-center">
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
                className="rounded-3xl bg-card border border-border p-5 flex flex-col gap-4"
              >
                {/* Goal Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-lg">
                    {goal.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">
                      {goal.progress}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10"
                      onClick={() => handleEditClick(goal)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
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
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors text-left w-full"
                      onClick={() => toggleMilestone(goal.id, milestone.id)}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="size-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="size-5 text-outline shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          milestone.completed
                            ? 'line-through text-outline'
                            : 'text-foreground'
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
