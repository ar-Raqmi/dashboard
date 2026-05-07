'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Flag, CheckCircle2, Circle, Pencil, GripVertical, Check, Layout as LayoutIcon } from 'lucide-react'
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// --- Milestone Item Component ---
interface MilestoneItemProps {
  milestone: { id: string; label: string; completed: boolean }
  index: number
  onRemove: (index: number) => void
  onLabelChange: (index: number, label: string) => void
}

function SortableMilestoneItem({ milestone, index, onRemove, onLabelChange }: MilestoneItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-xl bg-muted text-sm group ${isDragging ? 'opacity-50 shadow-md ring-2 ring-primary/20' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-card/50 transition-colors">
        <GripVertical className="size-3.5 text-on-surface-variant/50" />
      </div>
      <span className="text-primary text-xs font-mono min-w-[1.2rem]">{index + 1}.</span>
      <Input
        value={milestone.label}
        onChange={(e) => onLabelChange(index, e.target.value)}
        className="flex-1 bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-foreground"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-lg text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  )
}

// --- Goal Card Component ---
function SortableGoalCard({ goal, isRearranging, onEdit, onDelete, onToggleMilestone }: {
  goal: any
  isRearranging: boolean
  onEdit: (goal: any) => void
  onDelete: (id: string) => void
  onToggleMilestone: (goalId: string, msId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id, disabled: !isRearranging })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-3xl bg-card border flex flex-col transition-all duration-300 ${
        isDragging ? 'opacity-50 shadow-2xl scale-[1.02] border-primary ring-4 ring-primary/10' : 'border-border'
      } ${isRearranging ? 'hover:border-primary/50' : ''}`}
    >
      <div className="p-6 flex flex-col gap-5">
        {/* Goal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isRearranging && (
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                <GripVertical className="size-5" />
              </div>
            )}
            <h3 className="font-bold text-foreground text-xl truncate">
              {goal.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
              {goal.progress}%
            </span>
            {!isRearranging && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10"
                  onClick={() => onEdit(goal)}
                >
                  <Pencil className="size-4.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(goal.id)}
                >
                  <Trash2 className="size-4.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 rounded-full bg-muted overflow-hidden relative shadow-inner">
          <motion.div
            className="h-full rounded-full bg-primary relative z-10"
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 1, ease: 'circOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-20 pointer-events-none" />
        </div>

        {/* Milestones - Flexible Height */}
        <div className="flex flex-col gap-2">
          {goal.milestones.map((milestone: any) => (
            <button
              key={milestone.id}
              disabled={isRearranging}
              className={`flex items-start gap-4 p-3 rounded-2xl transition-all duration-200 text-left w-full group/ms ${
                isRearranging 
                  ? 'opacity-70 cursor-default' 
                  : 'hover:bg-muted/80 active:scale-[0.98]'
              }`}
              onClick={() => onToggleMilestone(goal.id, milestone.id)}
            >
              <div className="mt-0.5 shrink-0 transition-transform duration-200 group-hover/ms:scale-110">
                {milestone.completed ? (
                  <CheckCircle2 className="size-5.5 text-primary" />
                ) : (
                  <Circle className="size-5.5 text-outline group-hover/ms:text-primary/50" />
                )}
              </div>
              <span
                className={`text-[15px] leading-relaxed flex-1 ${
                  milestone.completed
                    ? 'line-through text-outline'
                    : 'text-foreground font-medium'
                }`}
              >
                {milestone.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const { 
    goals, addGoal, deleteGoal, updateGoal, toggleMilestone, 
    highlightedGoalId, setHighlightedGoal,
    reorderGoals
  } = useAppStore()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isRearranging, setIsRearranging] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [goals, goals.map(g => g.order).join(',')]) // Added robust dependency

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedGoalId) {
      const timer = setTimeout(() => setHighlightedGoal(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedGoalId, setHighlightedGoal])

  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [goalTitle, setGoalTitle] = useState('')
  const [milestoneInput, setMilestoneInput] = useState('')
  const [milestones, setMilestones] = useState<{ id: string; label: string; completed: boolean }[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleMilestoneLabelChange = (index: number, label: string) => {
    const newMilestones = [...milestones]
    newMilestones[index] = { ...newMilestones[index], label }
    setMilestones(newMilestones)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    
    if (over && active.id !== over.id) {
      const oldIndex = sortedGoals.findIndex((g) => g.id === active.id)
      const newIndex = sortedGoals.findIndex((g) => g.id === over.id)
      
      const newGoals = arrayMove(sortedGoals, oldIndex, newIndex)
      reorderGoals(newGoals.map(g => g.id))
    }
  }

  const handleMilestoneDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setMilestones((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
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
        order: goals.length,
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


  const activeGoal = activeId ? goals.find(g => g.id === activeId) : null

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-4xl mx-auto min-h-full pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl bg-primary/15 shadow-sm ring-1 ring-primary/10">
            <Flag className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Goals</h1>
            <p className="text-xs text-muted-foreground font-medium">Track your personal growth and milestones</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isRearranging ? "default" : "outline"}
            className={`rounded-2xl gap-2 h-11 px-5 font-bold transition-all duration-300 ${
              isRearranging 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/20' 
                : 'border-border hover:bg-muted'
            }`}
            onClick={() => setIsRearranging(!isRearranging)}
          >
            {isRearranging ? <Check className="size-4.5" /> : <LayoutIcon className="size-4.5" />}
            {isRearranging ? 'Done' : 'Rearrange'}
          </Button>

          <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-11 px-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="size-5 mr-1" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border rounded-[2rem] sm:max-w-md shadow-2xl p-0 overflow-hidden">
              <div className="p-8 pb-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    {editingGoal ? 'Edit Goal' : 'Create Goal'}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-6">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest ml-1">Title</label>
                    <Input
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="What do you want to achieve?"
                      className="h-12 rounded-2xl bg-muted border-none text-lg font-medium px-5 focus-visible:ring-2 ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest ml-1">Milestones</label>
                    <div className="flex gap-2">
                      <Input
                        value={milestoneInput}
                        onChange={(e) => setMilestoneInput(e.target.value)}
                        placeholder="Add a step..."
                        className="h-11 rounded-2xl bg-muted border-none px-4 focus-visible:ring-2 ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddMilestone()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 rounded-2xl px-4 shrink-0 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                        onClick={handleAddMilestone}
                      >
                        <Plus className="size-5" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleMilestoneDragEnd}
                      >
                        <SortableContext
                          items={milestones.map(m => m.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {milestones.map((m, i) => (
                            <SortableMilestoneItem
                              key={m.id}
                              milestone={m}
                              index={i}
                              onRemove={handleRemoveMilestone}
                              onLabelChange={handleMilestoneLabelChange}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                      {milestones.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-3xl border-2 border-dashed border-border/50">
                          No milestones added yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 p-6 flex justify-end gap-3 border-t">
                <DialogClose asChild>
                  <Button variant="ghost" className="rounded-xl h-11 px-6 font-bold">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleAddGoal}
                  disabled={!goalTitle.trim() || milestones.length === 0}
                  className="rounded-xl h-11 px-8 font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Goals List */}
      <div className="flex-1">
        {goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-6 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border"
          >
            <div className="p-6 rounded-[2rem] bg-background shadow-xl">
              <Flag className="size-16 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">No active goals</h2>
              <p className="text-muted-foreground">Start your journey by adding your first goal today.</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="rounded-2xl h-12 px-8 font-bold">
              Get Started
            </Button>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedGoals.map(g => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-6">
                {sortedGoals.map((goal) => (
                  <SortableGoalCard
                    key={goal.id}
                    goal={goal}
                    isRearranging={isRearranging}
                    onEdit={handleEditClick}
                    onDelete={deleteGoal}
                    onToggleMilestone={toggleMilestone}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeGoal ? (
                <SortableGoalCard
                  goal={activeGoal}
                  isRearranging={true}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onToggleMilestone={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}
