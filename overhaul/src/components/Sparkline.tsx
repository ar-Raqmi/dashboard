const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Seven-point trend; `days` labels each point (defaults to the last seven weekdays ending today). */
export function Sparkline({ data, color = 'var(--green)', unit = '', days }: { data: number[]; color?: string; unit?: string; days?: string[] }) {
  const max = Math.max(...data), min = Math.min(...data);
  const today = new Date().getDay();
  const labels = days ?? data.map((_, i) => WEEKDAYS[(today - (data.length - 1 - i) + 70) % 7]);
  const points = data.map((v, i) => `${i * 13 + 2},${29 - ((v - min) / (max - min || 1)) * 22}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 84 34" aria-label="Seven-day trend" role="img"><polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>{data.map((v, i) => <circle key={i} cx={i * 13 + 2} cy={29 - ((v - min) / (max - min || 1)) * 22} r="5" fill="transparent"><title>{labels[i]}: {v} {unit}</title></circle>)}</svg>;
}
