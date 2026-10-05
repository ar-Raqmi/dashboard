import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { dateFormat } from '@/lib/dateFormat';
import { useStore } from '@/store';

interface DateFieldProps {
  /** YYYY-MM-DD, or '' when empty. */
  value: string;
  onChange: (key: string) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * A date input that shows the date in the user's chosen style. With the automatic style it is the browser's
 * own date input; otherwise a text box that understands the pattern, with a button for the browser's picker.
 */
export function DateField({ value, onChange, required, disabled, label }: DateFieldProps) {
  const pattern = useStore(s => s.settings?.dateFormat) ?? dateFormat.setting;
  const picker = useRef<HTMLInputElement>(null);
  const shown = value ? dateFormat.format(value, pattern) : '';
  const [text, setText] = useState(shown);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setText(shown); setInvalid(false); }, [shown]);

  if (pattern === 'auto') {
    return <input type="date" aria-label={label} required={required} disabled={disabled} value={value} onChange={e => onChange(e.target.value)}/>;
  }

  function commit() {
    if (!text.trim()) { setInvalid(false); onChange(''); return; }
    const key = dateFormat.parse(text, pattern);
    setInvalid(!key);
    if (key) onChange(key);
  }

  return <span className="date-field">
    <input type="text" inputMode="numeric" aria-label={label} aria-invalid={invalid || undefined} required={required} disabled={disabled} placeholder={pattern.toLowerCase()} value={text}
      onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}/>
    <button type="button" className="icon-button compact" aria-label="Pick a date" disabled={disabled} onClick={() => picker.current?.showPicker()}><Icon name="calendar" size={15}/></button>
    <input ref={picker} className="visually-hidden" type="date" tabIndex={-1} aria-hidden="true" value={value} onChange={e => onChange(e.target.value)}/>
  </span>;
}
