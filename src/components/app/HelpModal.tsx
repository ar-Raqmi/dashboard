'use client'

import Modal from '@/components/ui/Modal'
import { useUi } from '@/lib/ui'

const SHORTCUTS: [string, string][] = [
  ['Search everything', 'Ctrl / ⌘ K'],
  ['Collapse or expand navigation', 'Ctrl / ⌘ B'],
  ['Create a new task', 'N'],
  ['Capture a note', 'Q'],
  ['Search from anywhere', '/'],
  ['Close a dialog or menu', 'Esc'],
]

export default function HelpModal() {
  const open = useUi((s) => s.helpOpen)
  const setOpen = useUi((s) => s.setHelpOpen)
  if (!open) return null

  return (
    <Modal title="A calmer place to get things done" onClose={() => setOpen(false)}>
      <div className="form-body">
        <p className="help-intro">
          Everything here is your own data, synced to your account: tasks (including repeating ones), the calendar, notes,
          goals and milestones, files, authenticator codes, prayer times and the daily verse.
        </p>
        <h3 className="help-heading">Shortcuts</h3>
        <div className="shortcut-list">
          {SHORTCUTS.map(([label, keys]) => (
            <div key={label}><span>{label}</span><kbd>{keys}</kbd></div>
          ))}
        </div>
        <p className="help-storage">Choose which Overview sections appear, plus your city, prayer source and appearance, in Settings.</p>
      </div>
      <div className="modal-footer">
        <span>Everforest · Inter · JetBrains Mono</span>
        <button className="button primary" onClick={() => setOpen(false)}>Back to work</button>
      </div>
    </Modal>
  )
}
