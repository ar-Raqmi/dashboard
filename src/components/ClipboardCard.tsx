import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { copyText } from '../utils/date';
import { Icon } from './Icon';

/** Scratch text that follows you across devices. Saved when the field loses focus. */
export function ClipboardCard({ notify }: { notify: (message: string) => void }) {
  const saved = useStore(s => s.settings?.clipboardText ?? '');
  const mutate = useStore(s => s.mutate);
  const [text, setText] = useState(saved);
  const focused = useRef(false);

  // A reload from another device or tab must not overwrite what is being typed.
  useEffect(() => { if (!focused.current) setText(saved); }, [saved]);

  const save = (clipboardText: string) => {
    if (clipboardText !== saved) void mutate('settings:update', { clipboardText }, ['settings']).catch(() => notify('Clipboard could not be saved. Try again.'));
  };
  const copy = () => void copyText(text).then(() => notify('Copied to clipboard')).catch(() => notify('Clipboard unavailable. Select and copy the text instead.'));

  return <section className="clipboard-card"><div className="section-heading"><h2>Clipboard</h2><div className="section-actions">
      <button className="text-button" onClick={copy} disabled={!text.trim()} aria-label="Copy clipboard text"><Icon name="copy" size={13}/>Copy</button>
      <button className="text-button" onClick={() => { setText(''); save(''); }} disabled={!text} aria-label="Clear clipboard text"><Icon name="close" size={13}/>Clear</button>
    </div></div>
    <textarea aria-label="Clipboard text" placeholder="Paste or type anything here. It follows you to your other devices." value={text} rows={4} spellCheck={false}
      onChange={e => setText(e.target.value)} onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; save(text); }}/>
  </section>;
}
