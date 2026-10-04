'use client'

import Modal from '@/components/ui/Modal'
import { useUi } from '@/lib/ui'

/** Renders the promise-based confirm and choice dialogs requested through the UI store. */
export default function DialogHost() {
  const confirmRequest = useUi((s) => s.confirmRequest)
  const resolveConfirm = useUi((s) => s.resolveConfirm)
  const choiceRequest = useUi((s) => s.choiceRequest)
  const resolveChoice = useUi((s) => s.resolveChoice)

  return (
    <>
      {confirmRequest && (
        <Modal title={confirmRequest.title} onClose={() => resolveConfirm(false)} className="confirm-modal">
          <div className="form-body">
            <p className="confirmation-copy">{confirmRequest.body}</p>
          </div>
          <div className="modal-footer">
            <button className="button" onClick={() => resolveConfirm(false)}>{confirmRequest.cancelLabel ?? 'Cancel'}</button>
            <button className={`button ${confirmRequest.danger ? 'danger-action' : 'primary'}`} onClick={() => resolveConfirm(true)}>
              {confirmRequest.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
      {choiceRequest && (
        <Modal title={choiceRequest.title} onClose={() => resolveChoice(null)} className="confirm-modal">
          <div className="form-body">
            <p className="confirmation-copy">{choiceRequest.body}</p>
            <div className="choice-list">
              {choiceRequest.options.map((o) => (
                <button key={o.id} className={`choice-option ${o.danger ? 'danger' : ''}`} onClick={() => resolveChoice(o.id)}>
                  <strong>{o.label}</strong>
                  {o.description && <small>{o.description}</small>}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <span />
            <button className="button" onClick={() => resolveChoice(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  )
}
