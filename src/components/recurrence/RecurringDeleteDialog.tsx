'use client'

import { Trash2, CalendarX, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RecurringDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: 'task' | 'event'
  mode: 'recurring' | 'single'
  itemTitle?: string
  occurrenceDate?: string
  /** Recurring mode: delete just one occurrence. */
  onDeleteThis?: () => void
  /** Recurring mode: delete the whole series. Single mode: delete the item. */
  onDeleteAll: () => void
}

export function RecurringDeleteDialog({
  open,
  onOpenChange,
  kind,
  mode,
  itemTitle,
  occurrenceDate,
  onDeleteThis,
  onDeleteAll,
}: RecurringDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {mode === 'recurring' ? `Delete recurring ${kind}` : `Delete ${kind}`}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {mode === 'recurring'
              ? `This ${kind} repeats. Choose what to delete.`
              : `Delete “${itemTitle}”? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-1">
          {mode === 'recurring' && (
            <button
              type="button"
              onClick={onDeleteThis}
              className="flex items-start gap-3 w-full text-left p-3 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <CalendarX className="size-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Delete this day only</p>
                <p className="text-xs text-muted-foreground break-words">
                  Skip {occurrenceDate} — the series continues.
                </p>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={onDeleteAll}
            className="flex items-start gap-3 w-full text-left p-3 rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-5 text-destructive mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-destructive">
                {mode === 'recurring' ? 'Delete the entire series' : `Delete this ${kind}`}
              </p>
              <p className="text-xs text-muted-foreground break-words">
                {mode === 'recurring' ? 'Remove every occurrence permanently.' : 'This action cannot be undone.'}
              </p>
            </div>
          </button>
        </div>

        <DialogClose asChild>
          <Button variant="ghost" className="rounded-2xl w-full mt-1">Cancel</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
