'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/lib/store'
import { copyText } from '@/lib/clipboard'
import { notify, notifyError } from '@/lib/toast'

/** Scratch text that follows you across devices. Saved when the field loses focus. */
export default function ClipboardCard() {
  const saved = useAppStore((s) => s.clipboardText)
  const setClipboardText = useAppStore((s) => s.setClipboardText)
  const [text, setText] = useState(saved)
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(saved)
  }, [saved])

  const save = () => {
    if (text !== saved) setClipboardText(text)
  }

  const copy = () => {
    if (!text.trim()) return
    copyText(text).then(() => notify('Copied to clipboard')).catch((e) => notifyError('Copy failed', e.message))
  }

  return (
    <section className="clipboard-card">
      <div className="section-heading">
        <h2>Clipboard</h2>
        <div className="section-actions">
          <button className="icon-button compact" title="Copy" aria-label="Copy clipboard text" onClick={copy} disabled={!text.trim()}><Icon name="copy" size={15} /></button>
          <button
            className="icon-button compact"
            title="Clear"
            aria-label="Clear clipboard text"
            disabled={!text}
            onClick={() => {
              setText('')
              setClipboardText('')
            }}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      </div>
      <textarea
        aria-label="Clipboard text"
        placeholder="Paste or type anything here. It follows you to your other devices."
        value={text}
        rows={5}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => { focused.current = true }}
        onBlur={() => {
          focused.current = false
          save()
        }}
      />
    </section>
  )
}
