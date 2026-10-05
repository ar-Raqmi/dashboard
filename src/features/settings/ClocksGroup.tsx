import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Icon } from '@/components/Icon';
import { Row } from './fields';

export function ClocksGroup({ clocks, notify }: { clocks: { id: string; label: string; timezone: string }[]; notify: (message: string) => void }) {
  const mutate = useStore(s => s.mutate);
  const zones = useMemo(() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC']; } }, []);
  const [label, setLabel] = useState(''), [zone, setZone] = useState('Asia/Riyadh');
  const fail = (err: unknown) => notify((err as Error).message);
  return <div className="settings-group" id="settings-clocks"><span className="eyebrow">WORLD CLOCKS</span>
    {clocks.map(c => <Row key={c.id} title={c.label} hint={c.timezone}><button className="icon-button" title={`Remove ${c.label}`} aria-label={`Remove ${c.label}`} onClick={() => void mutate('clocks:remove', { id: c.id }, ['clocks']).then(() => notify('Clock removed')).catch(fail)}><Icon name="trash" size={15}/></button></Row>)}
    {!clocks.length && <p className="settings-description">No cities yet. Your local time is always shown.</p>}
    <form className="form-grid mt-4" onSubmit={e => { e.preventDefault(); if (!label.trim()) return; void mutate('clocks:add', { label: label.trim(), timezone: zone }, ['clocks']).then(() => { setLabel(''); notify('Clock added'); }).catch(fail); }}>
      <label className="form-label">City<input required maxLength={80} placeholder="e.g. Makkah" value={label} onChange={e => setLabel(e.target.value)}/></label>
      <label className="form-label">Time zone<select value={zone} onChange={e => setZone(e.target.value)}>{zones.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}</select></label>
      <div className="settings-data-actions" style={{ marginTop: 0 }}><button className="button" type="submit"><Icon name="plus" size={14}/>Add clock</button></div>
    </form>
  </div>;
}
