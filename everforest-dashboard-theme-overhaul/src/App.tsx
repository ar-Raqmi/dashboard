import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Chart from 'chart.js/auto';
import type { ChartConfiguration, Plugin } from 'chart.js';
import { getFontEmbedCSS, toPng } from 'html-to-image';

type IconName = 'overview' | 'tasks' | 'calendar' | 'notes' | 'files' | 'book' | 'flag' | 'shield' | 'settings' | 'help' | 'search' | 'down' | 'right' | 'left' | 'collapse' | 'bell' | 'plus' | 'upRight' | 'arrow' | 'filter' | 'clock' | 'sun' | 'moon' | 'more' | 'check' | 'close' | 'external' | 'copy' | 'download' | 'upload' | 'refresh' | 'sort' | 'pin' | 'target' | 'file' | 'trash' | 'pen' | 'info' | 'location';
const iconPaths: Record<IconName, ReactNode> = {
  overview: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/></>,
  tasks: <><circle cx="12" cy="12" r="8.5"/><path d="m8 12 2.7 2.7L16.5 9"/></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 10h17M7.5 14h2M14.5 14h2M7.5 17h2"/></>,
  notes: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>,
  files: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  book: <path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1zM12 5v15"/>,
  flag: <path d="M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>,
  shield: <><path d="M12 3 4.5 6v5c0 5 3.5 8 7.5 10 4-2 7.5-5 7.5-10V6z"/><path d="m8.5 11.5 2.5 2.5 4.5-4.5"/></>,
  settings: <><path d="m9.5 3-.7 2.3-2 .9-2.2-.6-2 3.4 1.6 1.7v2.6L2.6 15l2 3.4 2.2-.6 2 .9.7 2.3h5l.7-2.3 2-.9 2.2.6 2-3.4-1.6-1.7v-2.6L21.4 9l-2-3.4-2.2.6-2-.9L14.5 3z"/><circle cx="12" cy="12" r="3"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 8.7a2.6 2.6 0 0 1 5 .9c0 2-2.5 2-2.5 4M12 17h.01"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  down: <path d="m7 10 5 5 5-5"/>, right: <path d="m9 6 6 6-6 6"/>, left: <path d="m15 6-6 6 6 6"/>,
  collapse: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m7-11-3 3 3 3"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, upRight: <path d="M6 18 18 6M7 6h11v11"/>, arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="8" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></>,
  moon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  check: <path d="m5 12 4.5 4.5L19 7"/>, close: <path d="m6 6 12 12M6 18 18 6"/>,
  external: <><path d="M14 3h7v7m0-7L11 13M10 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5"/></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>, upload: <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/>,
  refresh: <path d="M20 7a8 8 0 0 0-14-2L3 8m0-5v5h5M4 17a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/>,
  sort: <path d="M8 4v16m-3-3 3 3 3-3M16 20V4m-3 3 3-3 3 3"/>,
  pin: <path d="m16 3 5 5-4 2-3 5-2 1-4-4 1-2 5-3zM8 16l-5 5"/>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  file: <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6"/>,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>,
  pen: <path d="m14 5 5 5M3 21l5-1L21 7a2.1 2.1 0 0 0 0-3l-1-1a2.1 2.1 0 0 0-3 0L4 16z"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
};
function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

type Page = 'Overview' | 'Tasks' | 'Calendar' | 'Notes' | 'Files' | 'Spiritual' | 'Goals' | 'Authenticator';
type Priority = 'High' | 'Medium' | 'Low';
type TaskStatus = 'To do' | 'In progress' | 'Completed';
type Task = { id: string; title: string; project: string; due: string; priority: Priority; status: TaskStatus; description: string };
type Note = { id: string; title: string; text: string; pinned: boolean; updated: string };
type Goal = { id: string; name: string; color: string; description: string; completed: number; total: number; milestones: { title: string; done: boolean }[] };
type CalendarEvent = { id: string; title: string; day: number; month: string; date: string; time: string; group: string; description: string; duration: number };
type LocalFile = { id: string; name: string; type: string; size: number; date: string; url: string };
type AuthAccount = { id: string; name: string; secret: string };
const TODAY = '2026-10-04';
const STORAGE_KEY = 'raqmi-everforest-workspace-v1';
const projectColors: Record<string, string> = { 'Data Science': 'var(--aqua)', ElectriHub: 'var(--yellow)', 'IIUM Research': 'var(--purple)', Admin: 'var(--subtle)', Personal: 'var(--blue)' };
const projects = ['Data Science', 'ElectriHub', 'IIUM Research', 'Admin', 'Personal'];
const initialTasks: Task[] = [
  { id: 'RQ-101', title: 'MPS: Fail Induk JKEKSA', project: 'Admin', due: '2026-09-08', priority: 'High', status: 'To do', description: 'Review the master file, collect outstanding documents, and prepare the JKEKSA submission.' },
  { id: 'RQ-102', title: 'Upload scanned files to DDMS', project: 'Admin', due: '2026-09-21', priority: 'High', status: 'To do', description: 'Check that all scanned pages are legible, use the agreed naming convention, and upload the final documents to DDMS.' },
  { id: 'RQ-103', title: 'Review linear algebra notes', project: 'Data Science', due: TODAY, priority: 'Medium', status: 'In progress', description: 'Work through eigenvalues and eigenvectors. Complete the three remaining practice problems.' },
  { id: 'RQ-104', title: 'Daily email & follow-ups', project: 'Personal', due: TODAY, priority: 'Low', status: 'To do', description: 'Review the inbox, reply to time-sensitive messages, and archive completed conversations.' },
  { id: 'RQ-105', title: 'Explore The Straight Path event', project: 'Personal', due: TODAY, priority: 'Low', status: 'To do', description: 'Look through the event programme and decide which sessions to attend.' },
  { id: 'RQ-106', title: 'Set up ElectriHub dashboard', project: 'ElectriHub', due: '2026-10-05', priority: 'Medium', status: 'In progress', description: 'Connect the meter readings to the overview and test the daily energy chart.' },
  { id: 'RQ-107', title: 'Read: attention mechanisms', project: 'IIUM Research', due: '2026-10-05', priority: 'Medium', status: 'To do', description: 'Read the survey paper and write a short summary of retrieval approaches for the research notebook.' },
  { id: 'RQ-108', title: 'Organize research references', project: 'IIUM Research', due: '2026-10-06', priority: 'Low', status: 'To do', description: 'Group the current reading list by topic and add missing publication metadata.' },
];
const initialNotes: Note[] = [
  { id: 'note-1', title: 'Master in Computer Science IIUM', text: 'Research direction\n\nArabic-centric neural retrieval for source-faithful question answering.\n\nNext steps\n- Refine the research question\n- Review the retrieval literature\n- Prepare questions for the next advisor meeting', pinned: true, updated: 'Oct 4' },
  { id: 'note-2', title: 'Hackathon app brainstorm', text: 'An intentional personal workspace.\n\nBring tasks, learning goals, and daily routines into a single, calm view. Keep the default screen useful in one glance.\n\nIdeas\n- Local-first storage\n- Gentle reminders\n- Keyboard-first navigation', pinned: true, updated: 'Oct 3' },
  { id: 'note-3', title: 'Useful links', text: 'A small reading list\n\nChart.js documentation\nhttps://www.chartjs.org/docs/latest/\n\nEverforest palette\nhttps://github.com/sainnhe/everforest\n\nInter typeface\nhttps://rsms.me/inter/', pinned: true, updated: 'Oct 2' },
  { id: 'note-4', title: 'Weekly reflection', text: 'What went well?\nMade steady progress on the research reading list.\n\nWhat needs attention?\nClose out the two overdue admin tasks.\n\nOne priority for next week\nFinish the first ElectriHub dashboard prototype.', pinned: false, updated: 'Oct 4' },
];
const initialGoals: Goal[] = [
  { id: 'data-science', name: 'Data Science', color: 'var(--aqua)', description: 'Build a strong foundation, one concept at a time.', completed: 3, total: 8, milestones: [{ title: 'Linear Algebra', done: true }, { title: 'Calculus & Optimization', done: false }, { title: 'Algorithm Complexity', done: false }, { title: 'Probability Theory', done: false }, { title: 'IBM Data Science Certificate', done: true }, { title: 'NVIDIA Generative AI Certificate', done: false }, { title: 'Google Advanced Data Analytics', done: false }, { title: 'Google AI Professional Certificate', done: true }] },
  { id: 'electrihub', name: 'ElectriHub', color: 'var(--yellow)', description: 'A clearer picture of everyday energy consumption.', completed: 5, total: 9, milestones: [{ title: 'Define the energy data model', done: true }, { title: 'Set up the project workspace', done: true }, { title: 'Build the meter integration', done: true }, { title: 'Design the overview', done: true }, { title: 'Add the reporting template', done: true }, { title: 'Set up the live dashboard', done: false }, { title: 'Test daily aggregation', done: false }, { title: 'Add consumption alerts', done: false }, { title: 'Deploy the first release', done: false }] },
];
const events: CalendarEvent[] = [
  { id: 'evt-1', title: 'AI Builder School', day: 5, month: 'OCT', date: '2026-10-05', time: '10:00 AM', group: 'Kracked Devs', description: 'A hands-on community session exploring practical AI projects. This is an illustrative calendar entry, not a verified event listing.', duration: 120 },
  { id: 'evt-2', title: 'Build with Kiro', day: 6, month: 'OCT', date: '2026-10-06', time: '8:00 PM', group: 'Community session', description: 'An evening of building, sharing, and learning with fellow developers. Sample calendar entry.', duration: 90 },
  { id: 'evt-3', title: 'Annual general meeting', day: 10, month: 'OCT', date: '2026-10-10', time: '9:30 AM', group: 'MPS', description: 'Review the agenda and bring the completed administrative documents. Sample calendar entry.', duration: 90 },
  { id: 'evt-4', title: 'Digital assistant training', day: 15, month: 'OCT', date: '2026-10-15', time: '2:00 PM', group: 'SHRDC', description: 'An introductory workshop on everyday digital assistants. Sample calendar entry.', duration: 180 },
  { id: 'evt-5', title: 'Google DevFest', day: 14, month: 'NOV', date: '2026-11-14', time: '9:00 AM', group: 'Waitlist', description: 'A sample entry on the community events watchlist. Event information is not live.', duration: 420 },
];
const focusWeek = [1.4, 2.2, 1.8, 3.4, 2.8, 4.5, 2.6];
const focusPrevious = [1.1, 2.5, 1.4, 2.6, 2.2, 3.7, 3.13];
const completedWeek = [3, 5, 2, 4, 3, 5, 2];
type Theme = 'dark' | 'light';
const chartTheme = {
  dark: {
    primary: '#A7C080', previous: '#7A8478', pointBorder: '#343F44',
    fillTop: 'rgba(167,192,128,0.16)', fillBottom: 'rgba(167,192,128,0)',
    crossFill: 'rgba(211,198,170,0.025)', crossLine: 'rgba(211,198,170,0.22)',
    tooltipBg: '#3D484D', tooltipBorder: 'rgba(255,255,255,0.08)', title: '#D3C6AA', body: '#9DA9A0', footer: '#7A8478',
    grid: 'rgba(255,255,255,0.05)', xTick: '#9DA9A0', yTick: '#7A8478',
  },
  light: {
    primary: '#8DA101', previous: '#939F91', pointBorder: '#FDF6E3',
    fillTop: 'rgba(141,161,1,0.15)', fillBottom: 'rgba(141,161,1,0)',
    crossFill: 'rgba(92,106,114,0.05)', crossLine: 'rgba(92,106,114,0.28)',
    tooltipBg: '#FFFBEF', tooltipBorder: 'rgba(92,106,114,0.14)', title: '#5C6A72', body: '#626F76', footer: '#8A968A',
    grid: 'rgba(92,106,114,0.12)', xTick: '#6B7A80', yTick: '#8A968A',
  },
} as const;

function readSaved() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (validWorkspace(stored)) return { tasks: stored.tasks, notes: stored.notes, goals: stored.goals };
  } catch { /* Blocked storage still permits an in-memory workspace. */ }
  return { tasks: initialTasks, notes: initialNotes, goals: initialGoals };
}
function downloadFile(content: string, name: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const input = document.createElement('textarea'); input.value = text; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.appendChild(input); input.select();
    const copied = document.execCommand('copy'); input.remove();
    if (!copied) throw new Error('Clipboard is not available in this browser.');
  }
}
function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => (container.current?.querySelector<HTMLElement>('input, textarea, select') || container.current?.querySelector<HTMLElement>('button'))?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== container.current) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab') {
        const items = Array.from(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, a[href], [tabindex="0"]') || []).filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={container} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div>{children}</div></div>;
}
function Sparkline({ data, color = 'var(--green)', unit = '' }: { data: number[]; color?: string; unit?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const points = data.map((v, i) => `${i * 13 + 2},${29 - ((v - min) / (max - min || 1)) * 22}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 84 34" aria-label="Seven-day sample trend" role="img"><polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>{data.map((v, i) => <circle key={i} cx={i * 13 + 2} cy={29 - ((v - min) / (max - min || 1)) * 22} r="5" fill="transparent"><title>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}: {v} {unit}</title></circle>)}</svg>;
}
function makeCrosshair(theme: Theme): Plugin<'line'> {
  return {
    id: 'raqmiCrosshair',
    beforeDatasetsDraw(chart) {
      const active = chart.getActiveElements(); if (!active.length) return;
      const c = chartTheme[theme], x = active[0].element.x, { ctx, chartArea } = chart;
      ctx.save(); ctx.fillStyle = c.crossFill; ctx.fillRect(x - 24, chartArea.top, 48, chartArea.bottom - chartArea.top);
      ctx.strokeStyle = c.crossLine; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke(); ctx.restore();
    },
  };
}
function getChartData(range: string, metric: string, completedDelta = 0) {
  const focus = metric === 'focus';
  if (range === '7') return { labels: ['Mon, Sep 28', 'Tue, Sep 29', 'Wed, Sep 30', 'Thu, Oct 1', 'Fri, Oct 2', 'Sat, Oct 3', 'Sun, Oct 4'], current: focus ? focusWeek : completedWeek.map((value, index) => value + (index === 6 ? completedDelta : 0)), previous: focus ? focusPrevious : [2, 3, 2, 3, 2, 4, 2] };
  const count = range === '30' ? 30 : 13;
  const labels = Array.from({ length: count }, (_, i) => { const d = new Date('2026-10-04T12:00:00'); d.setDate(d.getDate() - (count - 1 - i) * (range === '90' ? 7 : 1)); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); });
  const current = Array.from({ length: count }, (_, i) => Number((focusWeek[i % 7] * (0.7 + (i % 5) * 0.12) * (range === '90' ? 5.5 : 1)).toFixed(1)));
  return { labels, current: focus ? current : current.map((v, i) => Math.round(v * 1.35) + (i === count - 1 ? completedDelta : 0)), previous: current.map((v, i) => focus ? Number((v * (0.6 + (i % 4) * 0.11)).toFixed(1)) : Math.round(v * 1.02)) };
}
function FocusChart({ refreshKey, reducedMotion, completedDelta, theme, onReport }: { refreshKey: number; reducedMotion: boolean; completedDelta: number; theme: Theme; onReport: (metric: string, range: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), chartRef = useRef<Chart<'line'> | null>(null);
  const [metric, setMetric] = useState('focus'), [range, setRange] = useState('7'), [compare, setCompare] = useState(true), [loading, setLoading] = useState(true);
  const chartDelta = metric === 'tasks' ? completedDelta : 0;
  useEffect(() => { setLoading(true); const timer = window.setTimeout(() => setLoading(false), refreshKey ? 480 : 300); return () => clearTimeout(timer); }, [refreshKey]);
  useEffect(() => {
    if (!canvas.current || loading) return;
    const data = getChartData(range, metric, chartDelta), context = canvas.current.getContext('2d'); if (!context) return;
    const c = chartTheme[theme];
    const fill = context.createLinearGradient(0, 0, 0, 245); fill.addColorStop(0, c.fillTop); fill.addColorStop(1, c.fillBottom);
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels: data.labels, datasets: [
        { label: 'This period', data: data.current, borderColor: c.primary, backgroundColor: fill, borderWidth: 2.2, tension: 0.36, fill: true, pointRadius: 0, pointHoverRadius: 4.5, pointHoverBorderWidth: 3, pointHoverBorderColor: c.pointBorder, pointHoverBackgroundColor: c.primary },
        { label: 'Previous period', data: data.previous, borderColor: c.previous, backgroundColor: c.previous, borderWidth: 1.4, borderDash: [4, 5], tension: 0.36, pointRadius: 0, pointHoverRadius: 4, pointHoverBorderWidth: 2, pointHoverBorderColor: c.pointBorder, hidden: !compare },
      ] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: reducedMotion ? 0 : 650, easing: 'easeOutQuart' }, interaction: { mode: 'index', intersect: false }, layout: { padding: { top: 8, right: 8, left: 0, bottom: 0 } },
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: c.tooltipBg, titleColor: c.title, bodyColor: c.body, borderColor: c.tooltipBorder, borderWidth: 1, padding: 13, cornerRadius: 7, boxWidth: 6, boxHeight: 6, boxPadding: 5, usePointStyle: true,
          titleFont: { family: 'Inter', size: 12, weight: 500 }, bodyFont: { family: 'JetBrains Mono', size: 11 }, titleMarginBottom: 10,
          callbacks: { label: item => ` ${item.dataset.label}: ${metric === 'focus' ? `${Math.floor(Number(item.raw))}h ${Math.round((Number(item.raw) % 1) * 60).toString().padStart(2, '0')}m` : `${item.raw} tasks`}`, footer: () => 'Illustrative data' }, footerColor: c.footer, footerFont: { family: 'Inter', size: 10, weight: 400 }, footerMarginTop: 10,
        } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: c.xTick, font: { family: 'Inter', size: 11 }, padding: 10, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, callback: (_, index) => range === '7' ? data.labels[index].split(',')[0] : data.labels[index] } },
          y: { beginAtZero: true, suggestedMax: range === '7' ? (metric === 'focus' ? 5 : 6) : undefined, border: { display: false }, grid: { color: c.grid, drawTicks: false }, ticks: { color: c.yTick, font: { family: 'JetBrains Mono', size: 10 }, padding: 13, maxTicksLimit: 5, precision: metric === 'focus' ? 1 : 0, callback: value => metric === 'focus' ? `${value}h` : value } },
        },
      }, plugins: [makeCrosshair(theme)],
    };
    const chart = new Chart(canvas.current, config); chartRef.current = chart;
    void document.fonts.ready.then(() => { if (chartRef.current === chart) chart.update('none'); });
    return () => { chart.destroy(); chartRef.current = null; };
  }, [metric, range, compare, loading, reducedMotion, chartDelta, theme]);
  function chartKey(e: ReactKeyboardEvent<HTMLCanvasElement>) {
    const chart = chartRef.current; if (!chart || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault(); const current = chart.getActiveElements()[0]?.index ?? -1;
    const next = Math.max(0, Math.min((chart.data.labels?.length || 1) - 1, current + (e.key === 'ArrowRight' ? 1 : -1)));
    const active = chart.data.datasets.flatMap((_, datasetIndex) => chart.isDatasetVisible(datasetIndex) ? [{ datasetIndex, index: next }] : []);
    chart.setActiveElements(active); const point = chart.getDatasetMeta(0).data[next]; chart.tooltip?.setActiveElements(active, { x: point.x, y: point.y }); chart.update('none');
  }
  const series = getChartData(range, metric, chartDelta), sumCurrent = series.current.reduce((a, b) => a + b, 0), sumPrevious = series.previous.reduce((a, b) => a + b, 0);
  const change = metric === 'focus' ? `${((sumCurrent / sumPrevious - 1) * 100).toFixed(1)}% more focus` : `${Math.round(sumCurrent - sumPrevious)} more tasks completed`;
  return <section className="focus-panel" aria-label="Activity chart">
    <div className="panel-heading"><div><h2>Focus overview</h2><p>{range === '7' ? 'Sample data / Sep 28 - Oct 4, 2026' : range === '30' ? 'Sample data / Sep 5 - Oct 4, 2026' : 'Sample data / Jul 7 - Oct 4 / Weekly totals'}</p></div><div className="select-wrap"><Icon name="calendar" size={14}/><select aria-label="Chart time range" value={range} onChange={e => setRange(e.target.value)}><option value="7">This week</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><Icon name="down" size={13}/></div></div>
    <div className="chart-toolbar"><div className="chart-tabs" role="tablist" aria-label="Chart metric"><button className={metric === 'focus' ? 'active' : ''} onClick={() => setMetric('focus')} role="tab" aria-selected={metric === 'focus'}>Focus time</button><button className={metric === 'tasks' ? 'active' : ''} onClick={() => setMetric('tasks')} role="tab" aria-selected={metric === 'tasks'}>Tasks completed</button></div><div className="chart-legend"><span><i className="legend-line current"/>{range === '7' ? 'This week' : 'This period'}</span><button className={!compare ? 'muted' : ''} onClick={() => setCompare(!compare)} title="Toggle previous-period comparison" aria-pressed={compare}><i className="legend-line previous"/>{range === '7' ? 'Last week' : 'Previous'}</button></div></div>
    <div className={`chart-canvas ${loading ? 'is-loading' : ''}`}>{loading ? <div className="chart-skeleton" aria-label="Loading focus data"><div/><div/><div/><div/></div> : <canvas ref={canvas} tabIndex={0} role="img" aria-label={`${metric === 'focus' ? 'Focus hours' : 'Completed tasks'} over ${range} days. Sample data. Use left and right arrow keys to inspect data points.`} onKeyDown={chartKey}/>}</div>
    <div className="chart-foot"><span><Icon name="upRight" size={13}/><strong>{change}</strong><span className="foot-comparison"> than {range === '7' ? 'last week' : 'the previous period'}</span></span><button className="text-button" onClick={() => onReport(metric, range)}>View report<Icon name="right" size={13}/></button></div>
  </section>;
}
function PriorityMark({ priority }: { priority: Priority }) {
  return <span className={`priority priority-${priority.toLowerCase()}`} title={`${priority} priority`}><span className="priority-bars"><i/><i/><i/></span><span>{priority}</span></span>;
}
function dueLabel(due: string) {
  if (due === TODAY) return 'Today'; if (due === '2026-10-05') return 'Tomorrow';
  return new Date(`${due}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function TaskTable({ tasks, onToggle, onSelect, onAdd, full = false, projectFilter, onViewAll, selectedId, onNotice }: { tasks: Task[]; onToggle: (id: string) => void; onSelect: (task: Task) => void; onAdd: () => void; full?: boolean; projectFilter: string | null; onViewAll: () => void; selectedId?: string; onNotice: (message: string) => void }) {
  const [tab, setTab] = useState('all'), [filterOpen, setFilterOpen] = useState(false), [priority, setPriority] = useState('All priorities');
  const [sort, setSort] = useState<{ key: 'title' | 'project' | 'due' | 'priority'; desc: boolean }>({ key: 'due', desc: false });
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (e: MouseEvent) => { if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const base = projectFilter ? tasks.filter(t => t.project === projectFilter) : tasks;
  const counts = { all: base.filter(t => t.status !== 'Completed').length, today: base.filter(t => t.due === TODAY && t.status !== 'Completed').length, upcoming: base.filter(t => t.due > TODAY && t.status !== 'Completed').length, completed: base.filter(t => t.status === 'Completed').length };
  const filtered = base.filter(t => (tab === 'all' ? t.status !== 'Completed' : tab === 'today' ? t.due === TODAY && t.status !== 'Completed' : tab === 'upcoming' ? t.due > TODAY && t.status !== 'Completed' : t.status === 'Completed') && (priority === 'All priorities' || t.priority === priority));
  const sorted = [...filtered].sort((a, b) => { const comparison = sort.key === 'priority' ? ['High', 'Medium', 'Low'].indexOf(a.priority) - ['High', 'Medium', 'Low'].indexOf(b.priority) : a[sort.key].localeCompare(b[sort.key]); return sort.desc ? -comparison : comparison; });
  const visible = full ? sorted : sorted.slice(0, 6), overdue = base.filter(t => t.due < TODAY && t.status !== 'Completed').length;
  function changeSort(key: typeof sort.key) { setSort({ key, desc: sort.key === key ? !sort.desc : false }); }
  return <section className={`task-section ${full ? 'full-table' : ''}`} aria-label="Your tasks">
    <div className="section-heading">
      <div className="heading-with-count"><h2>{projectFilter || 'Your tasks'}</h2><span className="count-label">{counts.all}</span>{overdue > 0 && <span className="overdue-count"><span className="tiny-dot"/>{overdue} overdue</span>}</div>
      <div className="section-actions"><div className="popover-anchor" ref={filterRef}><button className={`small-button ${priority !== 'All priorities' ? 'is-filtered' : ''}`} onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}><Icon name="filter" size={15}/>Filter{priority !== 'All priorities' && <span className="filter-number">1</span>}</button>{filterOpen && <div className="popover filter-menu"><span className="menu-label">PRIORITY</span>{['All priorities', 'High', 'Medium', 'Low'].map(p => <button key={p} className={p === priority ? 'selected' : ''} onClick={() => { setPriority(p); setFilterOpen(false); }}>{p}{p === priority && <Icon name="check" size={14}/>}</button>)}</div>}</div><button className="icon-button compact" title="Add a task" aria-label="Add a task" onClick={onAdd}><Icon name="plus" size={17}/></button></div>
    </div>
    <div className="task-tabs" role="tablist" aria-label="Task state">{[['all', 'All tasks'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['completed', 'Completed']].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}<span>{counts[id as keyof typeof counts]}</span></button>)}</div>
    <div className="table-scroll"><table className="task-table">
      <thead><tr><th className="check-column"><button className="table-check" aria-label="Complete all visible tasks" title="Complete all visible tasks" onClick={() => { const incomplete = visible.filter(t => t.status !== 'Completed'); incomplete.forEach(t => onToggle(t.id)); if (incomplete.length) onNotice('Visible tasks marked complete'); }}><span/></button></th>{([['title', 'Task'], ['project', 'Project'], ['due', 'Due date'], ['priority', 'Priority']] as const).map(([key, label]) => <th key={key} aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : 'none'}><button onClick={() => changeSort(key)}>{label}{sort.key === key ? <Icon name="down" size={11} className={sort.desc ? 'rotate' : ''}/> : <Icon name="sort" size={11} className="sort-hint"/>}</button></th>)}</tr></thead>
      <tbody>{visible.map(task => <tr key={task.id} className={`${selectedId === task.id ? 'selected-row' : ''} ${task.status === 'Completed' ? 'completed-row' : ''}`} onClick={() => onSelect(task)}>
        <td className="check-column"><button className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''} ${task.status === 'In progress' ? 'in-progress' : ''}`} title={task.status === 'Completed' ? 'Mark incomplete' : 'Mark complete'} aria-label={`${task.status === 'Completed' ? 'Reopen' : 'Complete'} ${task.title}`} aria-pressed={task.status === 'Completed'} onClick={e => { e.stopPropagation(); onToggle(task.id); }}>{task.status === 'Completed' && <Icon name="check" size={11}/>}</button></td>
        <td className="task-name"><button onClick={e => { e.stopPropagation(); onSelect(task); }} title={task.title}>{task.title}</button></td>
        <td><span className="project-name"><i style={{ background: projectColors[task.project] || 'var(--subtle)' }}/>{task.project}</span></td>
        <td><span className={`due-date ${task.due < TODAY && task.status !== 'Completed' ? 'overdue' : ''} ${task.due === TODAY ? 'due-today' : ''}`} title={`Due ${task.due}${task.due < TODAY ? ' (relative to the sample date)' : ''}`}>{dueLabel(task.due)}</span></td>
        <td><PriorityMark priority={task.priority}/></td>
      </tr>)}</tbody>
    </table></div>
    {visible.length === 0 && <div className="empty-state compact-empty"><Icon name="tasks" size={26}/><h3>{tab === 'completed' ? 'A fresh start' : 'All clear here'}</h3><p>{tab === 'completed' ? 'Complete a task to see it here.' : 'No tasks match this view.'}</p>{priority !== 'All priorities' && <button className="text-button" onClick={() => setPriority('All priorities')}>Clear filter</button>}</div>}
    <div className="table-footer"><span>{visible.length ? `${visible.length} of ${sorted.length} tasks` : 'No tasks'}<span className="sample-table-label">&nbsp;&nbsp;/&nbsp;&nbsp; Sample data</span></span>{!full ? <button className="text-button" onClick={onViewAll}>View all tasks<Icon name="arrow" size={13}/></button> : <button className="text-button" onClick={() => {
      const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
      const csv = ['Task,Project,Due date,Priority,Status', ...sorted.map(t => [t.title, t.project, t.due, t.priority, t.status].map(cell).join(','))].join('\n');
      downloadFile(csv, 'raqmi-tasks.csv', 'text/csv'); onNotice('Task export downloaded');
    }}><Icon name="download" size={13}/>Export CSV</button>}</div>
  </section>;
}

function PrayerTimes({ expanded = false }: { expanded?: boolean }) {
  return <section className={`prayer-section ${expanded ? 'expanded-prayer' : ''}`}><div className="rail-section-heading"><h2>Prayer times</h2><Icon name="moon" size={17}/></div><div className="location-label"><Icon name="location" size={11}/>Kuala Lumpur, MY<span className="timezone-label">MYT</span></div><div className="next-prayer"><div><span className="eyebrow">NEXT PRAYER</span><div className="prayer-name">Asr<span className="prayer-countdown">in 1h 38m</span></div></div><div className="next-prayer-time">4:16<span>PM</span></div></div><div className="prayer-progress" title="Sample day: 2 of 5 prayer times passed"><i/><i/><i className="future"/><i className="future"/><i className="future"/></div><div className="prayer-list">{[['Fajr', '5:53', 'AM'], ['Dhuhr', '1:05', 'PM'], ['Asr', '4:16', 'PM'], ['Maghrib', '7:06', 'PM'], ['Isha', '8:15', 'PM']].map(([name, time, meridiem], index) => <div className={`prayer-row ${name === 'Asr' ? 'next' : ''} ${index < 2 ? 'passed' : ''}`} key={name} title={`${name} at ${time} ${meridiem} MYT. Illustrative schedule.`}><span>{index < 2 ? <Icon name="check" size={12}/> : <i className={name === 'Asr' ? 'tiny-dot' : 'prayer-dot'}/>}<span>{name}</span>{name === 'Asr' && <span className="next-label">NEXT</span>}</span><time>{time}<span>{meridiem}</span></time></div>)}</div><div className="prayer-disclaimer"><Icon name="info" size={10}/>Sample schedule, not live prayer times</div></section>;
}
function EventList({ onEvent, onCalendar }: { onEvent: (event: CalendarEvent) => void; onCalendar: () => void }) {
  return <section className="upcoming-section"><div className="rail-section-heading"><h2>Coming up</h2><button className="icon-button compact" title="Open calendar" aria-label="Open calendar" onClick={onCalendar}><Icon name="calendar" size={16}/></button></div><div className="event-list">{events.slice(0, 3).map(event => <button className="event-item" key={event.id} onClick={() => onEvent(event)} title={`${event.title}, ${event.date}, ${event.time} MYT. Sample event.`}><span className="event-date"><span>{event.day.toString().padStart(2, '0')}</span><small>{event.month}</small></span><span className="event-copy"><strong>{event.title}</strong><small>{event.group}<span className="middle-dot">&middot;</span>{event.time}</small></span><Icon name="right" size={13} className="event-arrow"/></button>)}</div><button className="text-button calendar-link" onClick={onCalendar}>View calendar<Icon name="arrow" size={13}/></button></section>;
}
function Verse({ full = false }: { full?: boolean }) {
  return <section className={`daily-verse ${full ? 'full-verse' : ''}`}><div className="verse-label"><Icon name="book" size={15}/><span>A moment of reflection</span></div><blockquote>To Him belongs whatever is in the heavens and whatever is on the earth. And indeed, Allah is the Free of need, the Praiseworthy.</blockquote><a href="https://quran.com/22/64" target="_blank" rel="noreferrer">Al-Hajj, 22:64<Icon name="upRight" size={12}/></a></section>;
}
function TaskDetail({ task, onClose, onUpdate, onDelete, onToggle }: { task: Task; onClose: () => void; onUpdate: (id: string, patch: Partial<Task>) => void; onDelete: (id: string) => void; onToggle: (id: string) => void }) {
  return <section className="task-detail"><div className="detail-overline"><span>{task.id}</span><button className="icon-button compact" onClick={onClose} title="Close task details" aria-label="Close task details"><Icon name="close" size={16}/></button></div><span className="sample-detail">Sample workspace task</span><h2>{task.title}</h2><button className={`button detail-complete ${task.status === 'Completed' ? 'completed' : ''}`} onClick={() => onToggle(task.id)}><Icon name="check" size={15}/>{task.status === 'Completed' ? 'Completed' : 'Mark complete'}</button><div className="detail-fields"><label><span>Status</span><select value={task.status} onChange={e => onUpdate(task.id, { status: e.target.value as TaskStatus })}><option>To do</option><option>In progress</option><option>Completed</option></select></label><label><span>Priority</span><select value={task.priority} onChange={e => onUpdate(task.id, { priority: e.target.value as Priority })}><option>High</option><option>Medium</option><option>Low</option></select></label><label><span>Project</span><select value={task.project} onChange={e => onUpdate(task.id, { project: e.target.value })}>{projects.map(p => <option key={p}>{p}</option>)}</select></label><label><span>Due date</span><input aria-label="Task due date" type="date" value={task.due} onChange={e => { if (e.target.value) onUpdate(task.id, { due: e.target.value }); }}/></label></div><label className="description-label">Description<textarea key={task.id} defaultValue={task.description} onBlur={e => onUpdate(task.id, { description: e.target.value })} placeholder="Add a little context..." rows={7}/></label><div className="detail-activity"><h3>Activity</h3><div><span className="avatar mini-avatar">IA</span><p>Added to your workspace<small>Local task &middot; saved on this device</small></p></div></div><button className="text-button danger-button" onClick={() => onDelete(task.id)}><Icon name="trash" size={14}/>Delete task</button></section>;
}
function NewTaskModal({ onClose, onSave, defaultProject }: { onClose: () => void; onSave: (task: Task) => void; defaultProject: string | null }) {
  const [title, setTitle] = useState(''), [project, setProject] = useState(defaultProject || 'Personal'), [due, setDue] = useState(TODAY), [priority, setPriority] = useState<Priority>('Medium'), [description, setDescription] = useState('');
  return <Modal title="Create a task" onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (!title.trim()) return; onSave({ id: `RQ-${Date.now().toString().slice(-6)}`, title: title.trim(), project, due, priority, status: 'To do', description }); }}><div className="form-body"><label className="form-label">Task name<input autoFocus required maxLength={160} placeholder="What needs to get done?" value={title} onChange={e => setTitle(e.target.value)}/></label><label className="form-label">Description <span>(optional)</span><textarea placeholder="Add context, links, or a next step..." rows={3} value={description} onChange={e => setDescription(e.target.value)}/></label><div className="form-grid"><label className="form-label">Project<select value={project} onChange={e => setProject(e.target.value)}>{projects.map(p => <option key={p}>{p}</option>)}</select></label><label className="form-label">Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority)}><option>High</option><option>Medium</option><option>Low</option></select></label></div><label className="form-label">Due date<input required type="date" value={due} onChange={e => setDue(e.target.value)}/></label></div><div className="modal-footer"><span>Stored on this device</span><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit"><Icon name="plus" size={15}/>Create task</button></div></div></form></Modal>;
}
function NoteModal({ note, onClose, onSave, onDelete, notify }: { note: Note | null; onClose: () => void; onSave: (note: Note) => void; onDelete: (id: string) => void; notify: (message: string) => void }) {
  const [title, setTitle] = useState(note?.title || ''), [text, setText] = useState(note?.text || ''), [pinned, setPinned] = useState(note?.pinned || false);
  return <Modal title={note ? 'Edit note' : 'Quick capture'} onClose={onClose} className="note-modal"><form onSubmit={e => { e.preventDefault(); onSave({ id: note?.id || `note-${Date.now()}`, title: title.trim() || 'Untitled note', text, pinned, updated: 'Just now' }); }}><div className="form-body"><input className="note-title-input" aria-label="Note title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your thought a title..." maxLength={160}/><textarea className="note-editor" aria-label="Note content" placeholder="The pen hasn't lifted. Start writing..." value={text} onChange={e => setText(e.target.value)} rows={12}/><div className="note-tools"><button type="button" className={`small-button ${pinned ? 'active' : ''}`} onClick={() => setPinned(!pinned)} aria-pressed={pinned}><Icon name="pin" size={14}/>{pinned ? 'Pinned' : 'Pin note'}</button><button type="button" className="icon-button" aria-label="Copy note" title="Copy note" onClick={() => copyText(`${title}\n\n${text}`).then(() => notify('Note copied to clipboard')).catch(() => notify('Clipboard unavailable. Select and copy the note text.'))}><Icon name="copy" size={16}/></button>{note && <button type="button" className="icon-button danger-button" aria-label="Delete note" title="Delete note" onClick={() => onDelete(note.id)}><Icon name="trash" size={16}/></button>}</div></div><div className="modal-footer"><span>Private to this browser</span><div><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Save note</button></div></div></form></Modal>;
}
function CalendarView({ onEvent }: { onEvent: (event: CalendarEvent) => void }) {
  const [month, setMonth] = useState(9), [year, setYear] = useState(2026), [selectedDay, setSelectedDay] = useState(4);
  const first = (new Date(year, month, 1).getDay() + 6) % 7, days = new Date(year, month + 1, 0).getDate();
  const label = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`, dayEvents = events.filter(e => e.date === selectedDate);
  function changeMonth(delta: number) { const d = new Date(year, month + delta, 1); setMonth(d.getMonth()); setYear(d.getFullYear()); setSelectedDay(1); }
  return <section className="calendar-view"><div className="section-heading"><h2>{label}</h2><div className="section-actions"><button className="small-button" onClick={() => { setMonth(9); setYear(2026); setSelectedDay(4); }}>Sample today</button><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><Icon name="left" size={16}/></button><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Next month"><Icon name="right" size={16}/></button></div></div><div className="calendar-grid">{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <span className="calendar-weekday" key={d}>{d}</span>)}{Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => { const day = i - first + 1; const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const found = events.filter(e => e.date === date); return day > 0 && day <= days ? <button key={i} className={`calendar-day ${day === selectedDay ? 'selected' : ''} ${date === TODAY ? 'today' : ''}`} onClick={() => setSelectedDay(day)} aria-label={`${label} ${day}${found.length ? `, ${found.length} event` : ''}`}><span>{day}</span>{found.map(e => <small key={e.id}><i/>{e.title}</small>)}</button> : <div key={i} className="calendar-day blank"/>; })}</div><div className="day-agenda"><h3>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>{dayEvents.length ? dayEvents.map(e => <button className="agenda-event" key={e.id} onClick={() => onEvent(e)}><time>{e.time}</time><span><strong>{e.title}</strong><small>{e.group}</small></span><Icon name="right" size={16}/></button>) : <p>No events scheduled. A little room to breathe.</p>}</div><p className="view-footnote">Sample calendar entries. Event details are illustrative, not verified listings.</p></section>;
}
function GoalsView({ goals, onChange }: { goals: Goal[]; onChange: (goals: Goal[]) => void }) {
  return <div className="goals-view">{goals.map(goal => <section key={goal.id} className="goal-detail"><div className="goal-detail-heading"><div><div className="goal-project-label"><i style={{ background: goal.color }}/><span>LEARNING & BUILDING</span></div><h2>{goal.name}</h2><p>{goal.description}</p></div><span className="goal-big-percentage">{Math.round(goal.completed / goal.total * 100)}<small>%</small></span></div><div className="goal-progress-track" role="progressbar" aria-valuenow={Math.round(goal.completed / goal.total * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`} title={`${goal.completed} of ${goal.total} milestones completed`}><span style={{ width: `${goal.completed / goal.total * 100}%`, background: goal.color }}/></div><div className="goal-progress-meta"><span>{goal.completed} of {goal.total} milestones complete</span><span>On track</span></div><div className="milestone-list">{goal.milestones.map((m, index) => <button key={m.title} className={m.done ? 'done' : ''} aria-pressed={m.done} onClick={() => onChange(goals.map(g => g.id !== goal.id ? g : { ...g, completed: g.completed + (m.done ? -1 : 1), milestones: g.milestones.map((item, i) => i === index ? { ...item, done: !item.done } : item) }))}><span className={`task-checkbox ${m.done ? 'checked' : ''}`}>{m.done && <Icon name="check" size={11}/>}</span>{m.title}</button>)}</div></section>)}</div>;
}
function WorldClocks() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  return <section className="world-clocks"><div className="section-heading"><h2>World clock</h2><span className="live-label"><i className="tiny-dot"/>LIVE</span></div>{[['Kuala Lumpur', 'Asia/Kuala_Lumpur', 'MYT'], ['Makkah', 'Asia/Riyadh', 'AST'], ['Tokyo', 'Asia/Tokyo', 'JST']].map(([city, zone, abbr]) => <div key={city}><span>{city}<small>{abbr}</small></span><time>{now.toLocaleTimeString('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false })}<small>{now.toLocaleTimeString('en-US', { timeZone: zone, second: '2-digit' })}</small></time></div>)}<p className="view-footnote">Live device time. Prayer times remain a clearly marked sample.</p></section>;
}
async function generateTotp(secret: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', clean = secret.replace(/[\s=-]/g, '').toUpperCase();
  if (!/^[A-Z2-7]{16,}$/.test(clean)) throw new Error('Enter a valid Base32 secret, at least 16 characters.');
  let bits = ''; for (const character of clean) bits += alphabet.indexOf(character).toString(2).padStart(5, '0');
  const keyBytes = Uint8Array.from(bits.match(/.{8}/g) || [], byte => parseInt(byte, 2));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const counter = new Uint8Array(8); new DataView(counter.buffer).setUint32(4, Math.floor(Date.now() / 30000));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter)), offset = signature[signature.length - 1] & 15;
  const binary = ((signature[offset] & 127) << 24) | (signature[offset + 1] << 16) | (signature[offset + 2] << 8) | signature[offset + 3];
  return (binary % 1000000).toString().padStart(6, '0');
}
function AuthenticatorView({ notify }: { notify: (message: string) => void }) {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]), [codes, setCodes] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(30 - Math.floor(Date.now() / 1000) % 30), [adding, setAdding] = useState(false), [name, setName] = useState(''), [secret, setSecret] = useState(''), [error, setError] = useState('');
  useEffect(() => { let cancelled = false; const update = async () => { setRemaining(30 - Math.floor(Date.now() / 1000) % 30); try { const results = await Promise.all(accounts.map(async account => [account.id, await generateTotp(account.secret)])); if (!cancelled) setCodes(Object.fromEntries(results)); } catch { if (!cancelled) setError('Code generation is unavailable in this browser.'); } }; void update(); const timer = setInterval(() => void update(), 1000); return () => { cancelled = true; clearInterval(timer); }; }, [accounts]);
  return <section className="authenticator-view"><div className="section-heading"><h2>Your accounts</h2><button className="button" onClick={() => setAdding(true)}><Icon name="plus" size={14}/>Add account</button></div><div className="security-notice"><Icon name="shield" size={19}/><p><strong>Session-only, by design.</strong> Secrets are kept in memory and are never sent to a server. Reloading or leaving this view removes them. Keep your recovery codes elsewhere.</p></div>{accounts.length ? accounts.map(account => <div className="auth-account" key={account.id}><span className="account-service-icon"><Icon name="shield" size={20}/></span><div><strong>{account.name}</strong><button className="auth-code" title="Copy one-time code" onClick={() => copyText(codes[account.id] || '').then(() => notify('One-time code copied')).catch(() => notify('Clipboard unavailable'))}>{codes[account.id]?.replace(/(\d{3})(\d{3})/, '$1 $2') || '------'}<Icon name="copy" size={15}/></button></div><span className="code-timer">{remaining}s</span><button className="icon-button" title="Remove account" aria-label={`Remove ${account.name}`} onClick={() => setAccounts(accounts.filter(a => a.id !== account.id))}><Icon name="trash" size={15}/></button></div>) : <div className="empty-state"><Icon name="shield" size={36}/><h3>No accounts connected</h3><p>Add an existing authenticator secret to generate real six-digit TOTP codes. No fabricated codes are displayed.</p><button className="button" onClick={() => setAdding(true)}>Add your first account<Icon name="plus" size={14}/></button></div>}{adding && <Modal title="Add an authenticator account" onClose={() => setAdding(false)}><form onSubmit={async e => { e.preventDefault(); try { if (!crypto.subtle) throw new Error('Web Crypto is unavailable. Open the downloaded HTML in a modern browser or use HTTPS.'); await generateTotp(secret); setAccounts([...accounts, { id: `auth-${Date.now()}`, name: name.trim(), secret }]); setName(''); setSecret(''); setError(''); setAdding(false); } catch (err) { setError((err as Error).message); } }}><div className="form-body"><label className="form-label">Account name<input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. GitHub"/></label><label className="form-label">Base32 secret<input type="password" autoComplete="off" value={secret} onChange={e => setSecret(e.target.value)} required placeholder="Your authenticator setup key"/></label><p className="view-footnote">Supports SHA-1, 6-digit codes, 30-second periods. This account only exists for this session.</p>{error && <p className="form-error" role="alert">{error}</p>}</div><div className="modal-footer"><span>Never shared or persisted</span><button className="button primary" type="submit">Add account</button></div></form></Modal>}</section>;
}

function validWorkspace(data: unknown): data is { version: number; tasks: Task[]; notes: Note[]; goals: Goal[] } {
  if (!data || typeof data !== 'object') return false;
  const value = data as { version?: number; tasks?: Task[]; notes?: Note[]; goals?: Goal[] };
  return value.version === 1 && Array.isArray(value.tasks) && Array.isArray(value.notes) && Array.isArray(value.goals)
    && value.tasks.every(t => t && typeof t.id === 'string' && typeof t.title === 'string' && projects.includes(t.project) && /^\d{4}-\d{2}-\d{2}$/.test(t.due) && !Number.isNaN(Date.parse(t.due)) && ['High', 'Medium', 'Low'].includes(t.priority) && ['To do', 'In progress', 'Completed'].includes(t.status) && typeof t.description === 'string')
    && value.notes.every(n => n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.text === 'string' && typeof n.pinned === 'boolean' && typeof n.updated === 'string')
    && value.goals.every(g => g && typeof g.id === 'string' && typeof g.name === 'string' && typeof g.description === 'string' && Object.values(projectColors).includes(g.color) && Array.isArray(g.milestones) && g.milestones.every(m => typeof m.title === 'string' && typeof m.done === 'boolean') && g.total === g.milestones.length && g.total > 0 && g.completed === g.milestones.filter(m => m.done).length)
    && new Set(value.tasks.map(t => t.id)).size === value.tasks.length && new Set(value.notes.map(n => n.id)).size === value.notes.length;
}

export default function App() {
  const [saved] = useState(readSaved);
  const [tasks, setTasks] = useState<Task[]>(saved.tasks), [notes, setNotes] = useState<Note[]>(saved.notes), [goals, setGoals] = useState<Goal[]>(saved.goals);
  const [page, setPage] = useState<Page>('Overview'), [collapsed, setCollapsed] = useState(false), [mobileNav, setMobileNav] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null), [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [newTask, setNewTask] = useState(false), [noteEditor, setNoteEditor] = useState<Note | 'new' | null>(null), [eventDetail, setEventDetail] = useState<CalendarEvent | null>(null);
  const [report, setReport] = useState<{ metric: string; range: string } | null>(null), [settings, setSettings] = useState(false), [help, setHelp] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches), [compact, setCompact] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0), [refreshing, setRefreshing] = useState(false), [toast, setToast] = useState('');
  const [searchOpen, setSearchOpen] = useState(false), [search, setSearch] = useState(''), [searchIndex, setSearchIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false), [notificationsRead, setNotificationsRead] = useState(false), [profileOpen, setProfileOpen] = useState(false), [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [noteQuery, setNoteQuery] = useState(''), [files, setFiles] = useState<LocalFile[]>([]);
  const [screenshotBusy, setScreenshotBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('raqmi-theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch { return 'dark'; }
  });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'task' | 'note' | 'reset'; id: string } | null>(null), [storageAvailable, setStorageAvailable] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null), importInput = useRef<HTMLInputElement>(null), mainRef = useRef<HTMLElement>(null), toolbarRef = useRef<HTMLDivElement>(null), workspaceRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTask = tasks.find(t => t.id === selectedTask), openTasks = tasks.filter(t => t.status !== 'Completed').length;
  const completedDelta = tasks.filter(t => t.status === 'Completed').length, completedCount = 24 + completedDelta, totalCount = 24 + tasks.length;
  const totalProgress = Math.round(goals.reduce((sum, g) => sum + g.completed / g.total, 0) / (goals.length || 1) * 100), overdue = tasks.filter(t => t.due < TODAY && t.status !== 'Completed').length;

  function notify(message: string) { setToast(message); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3500); }
  function navigate(next: Page, project: string | null = null) { setPage(next); setProjectFilter(project); setSelectedTask(null); setMobileNav(false); setWorkspaceOpen(false); mainRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }
  function toggleTask(id: string) { setTasks(current => current.map(task => task.id !== id ? task : { ...task, status: task.status === 'Completed' ? 'To do' : 'Completed' })); }
  function updateTask(id: string, patch: Partial<Task>) { setTasks(current => current.map(task => task.id === id ? { ...task, ...patch } : task)); }
  function refresh() { setRefreshing(true); setRefreshKey(k => k + 1); setTimeout(() => { setRefreshing(false); notify('Workspace refreshed. Your changes stay on this device.'); }, 650); }
  function exportWorkspace() { downloadFile(JSON.stringify({ version: 1, sampleDate: TODAY, tasks, notes, goals }, null, 2), 'raqmi-workspace.json', 'application/json'); notify('Workspace exported'); }
  function addFiles(incoming: File[]) { const added = incoming.map((file, i) => ({ id: `${Date.now()}-${i}`, name: file.name, size: file.size, type: file.type, date: 'Just now', url: URL.createObjectURL(file) })); setFiles(current => [...current, ...added]); if (added.length) notify(`${added.length} file${added.length === 1 ? '' : 's'} added to this session`); }

  async function saveScreenshot() {
    if (screenshotBusy) return;
    setScreenshotBusy(true); setProfileOpen(false); setNotificationsOpen(false);
    notify('Preparing your screenshot...');
    try {
      await new Promise(resolve => setTimeout(resolve, 750));
      await document.fonts.ready;
      const node = document.querySelector<HTMLElement>('.app-shell');
      if (!node) throw new Error('Workspace not found');
      let fontEmbedCSS = '';
      try { fontEmbedCSS = await getFontEmbedCSS(node, { preferredFontFormat: 'woff2' }); } catch { /* System typefaces provide an offline screenshot fallback. */ }
      const dataUrl = await toPng(node, {
        backgroundColor: theme === 'light' ? '#EFEBD4' : '#232A2E', pixelRatio: 2, fontEmbedCSS,
        filter: element => !(element instanceof Element) || !element.matches('.popover, .toast, .modal-backdrop, .mobile-scrim, .visually-hidden, .skip-link'),
      });
      const link = document.createElement('a'); link.href = dataUrl; link.download = `raqmi-${page.toLowerCase()}-screenshot.png`;
      document.body.appendChild(link); link.click(); link.remove();
      notify('Screenshot downloaded');
    } catch { notify('Screenshot export is unavailable here. Use your browser screenshot tool instead.'); }
    finally { setScreenshotBusy(false); }
  }

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks, notes, goals })); setStorageAvailable(true); } catch { setStorageAvailable(false); } }, [tasks, notes, goals]);
  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', reducedMotion); }, [reducedMotion]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#EFEBD4' : '#232A2E');
    try { localStorage.setItem('raqmi-theme', theme); } catch { /* Preference remains for this session. */ }
  }, [theme]);
  useEffect(() => { document.title = `${projectFilter || page} - Raqmi`; }, [page, projectFilter]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isTyping = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName), hasDialog = !!document.querySelector('[role="dialog"]');
      const plainKey = !e.metaKey && !e.ctrlKey && !e.altKey;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !document.querySelector('.modal:not(.search-modal)')) { e.preventDefault(); setSearchOpen(v => !v); setSearch(''); setSearchIndex(0); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !hasDialog) { e.preventDefault(); setCollapsed(v => !v); }
      else if (e.key === 'Escape') { setNotificationsOpen(false); setProfileOpen(false); setWorkspaceOpen(false); setMobileNav(false); }
      else if (e.key.toLowerCase() === 'n' && plainKey && !isTyping && !hasDialog) { e.preventDefault(); setNewTask(true); }
      else if (e.key.toLowerCase() === 'q' && plainKey && !isTyping && !hasDialog) { e.preventDefault(); setNoteEditor('new'); }
      else if (e.key === '/' && plainKey && !isTyping && !hasDialog) { e.preventDefault(); setSearchOpen(true); setSearch(''); setSearchIndex(0); }
    };
    const outside = (e: MouseEvent) => { if (!toolbarRef.current?.contains(e.target as Node)) { setNotificationsOpen(false); setProfileOpen(false); } if (!workspaceRef.current?.contains(e.target as Node)) setWorkspaceOpen(false); };
    document.addEventListener('keydown', handler); document.addEventListener('mousedown', outside);
    return () => { document.removeEventListener('keydown', handler); document.removeEventListener('mousedown', outside); };
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const navItems: { name: Page; icon: IconName }[] = [{ name: 'Overview', icon: 'overview' }, { name: 'Tasks', icon: 'tasks' }, { name: 'Calendar', icon: 'calendar' }, { name: 'Notes', icon: 'notes' }, { name: 'Files', icon: 'files' }];
  const pageDescriptions: Record<Page, string> = { Overview: 'A little clarity for the day ahead.', Tasks: 'Your priorities, all in one place.', Calendar: 'Your commitments, with room to breathe.', Notes: 'A place for the thoughts worth keeping.', Files: 'The documents behind your work.', Spiritual: 'Stay grounded in your daily rhythm.', Goals: 'Small steps. Meaningful progress.', Authenticator: 'A quiet place for your one-time codes.' };
  const searchResults = [
    ...tasks.map(t => ({ id: t.id, title: t.title, kind: `Task / ${t.project}`, icon: 'tasks' as IconName, action: () => { navigate('Tasks'); setSelectedTask(t.id); } })),
    ...notes.map(n => ({ id: n.id, title: n.title, kind: 'Note', icon: 'notes' as IconName, action: () => setNoteEditor(n) })),
    ...([...navItems, { name: 'Goals' as Page, icon: 'flag' as IconName }, { name: 'Spiritual' as Page, icon: 'book' as IconName }, { name: 'Authenticator' as Page, icon: 'shield' as IconName }]).map(n => ({ id: n.name, title: n.name, kind: 'Navigate', icon: n.icon, action: () => navigate(n.name) })),
  ].filter(item => !search || `${item.title} ${item.kind}`.toLowerCase().includes(search.toLowerCase())).slice(0, 9);

  function addCalendarEvent(event: CalendarEvent) {
    const match = event.time.match(/(\d+):(\d+) (AM|PM)/); let hours = Number(match?.[1] || 10) % 12; if (match?.[3] === 'PM') hours += 12;
    const start = new Date(`${event.date}T${String(hours).padStart(2, '0')}:${match?.[2] || '00'}:00+08:00`), end = new Date(start.getTime() + event.duration * 60000);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    downloadFile(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Raqmi//Sample Workspace//EN\r\nBEGIN:VEVENT\r\nUID:${event.id}@raqmi.local\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:[Sample] ${event.title}\r\nDESCRIPTION:Illustrative event from the Raqmi sample workspace.\r\nEND:VEVENT\r\nEND:VCALENDAR`, `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`, 'text/calendar');
    notify('Calendar file downloaded');
  }

  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileNav ? 'mobile-nav-open' : ''} ${compact ? 'compact-density' : ''}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand-row"><button className="brand" onClick={() => navigate('Overview')} aria-label="Raqmi overview"><svg width="28" height="31" viewBox="0 0 28 31" fill="none" aria-hidden="true"><path d="M5 25.5 22 5M8.5 21.3C5 10.5 11.5 3.2 25 2c-.2 13-7.5 21-16.5 19.3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m12.5 16.5-.8-6M16.3 12.2l5.3-.5M6.5 27H20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg><span>raqmi<span className="brand-period">.</span></span></button><button className="collapse-button icon-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`} onClick={() => setCollapsed(!collapsed)}><Icon name="collapse" size={17}/></button></div>
      <div className="workspace-switcher-wrap" ref={workspaceRef}>
        <button className="workspace-switcher" onClick={() => setWorkspaceOpen(!workspaceOpen)} title="Personal workspace" aria-expanded={workspaceOpen}><span className="workspace-avatar">IA</span><span className="workspace-text"><strong>Personal workspace</strong><small>A space for your every day</small></span><Icon name="down" size={13}/></button>
        {workspaceOpen && <div className="popover workspace-menu"><span className="menu-label">YOUR WORKSPACE</span><div className="workspace-menu-current"><span className="workspace-avatar">IA</span><span>Personal workspace<small>Local sample workspace</small></span><Icon name="check" size={14}/></div><button onClick={() => { setSettings(true); setWorkspaceOpen(false); }}><Icon name="settings" size={15}/>Workspace settings</button><button onClick={() => { exportWorkspace(); setWorkspaceOpen(false); }}><Icon name="download" size={15}/>Export workspace</button></div>}
      </div>
      <div className="sidebar-scroll">
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="main-nav">{navItems.map(item => <button key={item.name} className={`nav-item ${page === item.name && !projectFilter ? 'active' : ''}`} onClick={() => navigate(item.name)} title={item.name} aria-current={page === item.name && !projectFilter ? 'page' : undefined}><Icon name={item.icon} size={18}/><span>{item.name}</span>{item.name === 'Tasks' && <small>{openTasks}</small>}</button>)}</nav>
        <div className="nav-section-label project-section-label"><span>PROJECTS</span><button className="icon-button compact" title="View goals and projects" aria-label="View goals and projects" onClick={() => navigate('Goals')}><Icon name="plus" size={13}/></button></div>
        <nav className="project-nav">{projects.slice(0, 3).map(project => <button className={`nav-item project-nav-item ${projectFilter === project ? 'active' : ''}`} key={project} onClick={() => navigate('Tasks', project)} title={project}><span className="project-symbol" style={{ color: projectColors[project] }}>{project === 'Data Science' ? <Icon name="target" size={15}/> : project === 'ElectriHub' ? <svg className="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m13 2-9 12h7l-1 8 10-13h-8z" strokeLinejoin="round"/></svg> : <Icon name="book" size={15}/>}</span><span>{project}</span><small>{tasks.filter(t => t.project === project && t.status !== 'Completed').length}</small></button>)}</nav>
        <div className="nav-section-label personal-section-label">PERSONAL</div>
        <nav>{([{ name: 'Goals', icon: 'flag' }, { name: 'Spiritual', icon: 'book' }, { name: 'Authenticator', icon: 'shield' }] as { name: Page; icon: IconName }[]).map(item => <button key={item.name} className={`nav-item ${page === item.name ? 'active' : ''}`} title={item.name} onClick={() => navigate(item.name)} aria-current={page === item.name ? 'page' : undefined}><Icon name={item.icon} size={18}/><span>{item.name}</span></button>)}</nav>
      </div>
      <div className="sidebar-bottom"><button className="quick-capture" title="Quick capture (Q)" onClick={() => setNoteEditor('new')}><Icon name="plus" size={16}/><span>Quick capture</span><kbd>Q</kbd></button><button className="nav-item" title="Settings" onClick={() => setSettings(true)}><Icon name="settings" size={17}/><span>Settings</span></button><button className="nav-item" title="Help & shortcuts" onClick={() => setHelp(true)}><Icon name="help" size={17}/><span>Help & shortcuts</span><Icon name="upRight" size={13}/></button><div className="sidebar-profile"><span className="avatar profile-avatar">IA</span><div><strong>Ibn Ahmad ar-Raqmi</strong><span>the pen hasn't lifted</span></div><button className="icon-button compact" title="Account settings" aria-label="Account settings" onClick={() => setSettings(true)}><Icon name="more" size={15}/></button></div></div>
    </aside>
    <div className="workspace-shell">
      <header className="topbar">
        <div className="breadcrumb"><button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Icon name="collapse" size={19}/></button>{collapsed && <button className="icon-button desktop-expand" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"><Icon name="collapse" size={17}/></button>}<span>Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{projectFilter || page}</span></div>
        <div className="toolbar-right" ref={toolbarRef}>
          <button className="search-trigger" onClick={() => { setSearchOpen(true); setSearch(''); setSearchIndex(0); }} aria-label="Search workspace"><Icon name="search" size={15}/><span>Search anything...</span><kbd>&#8984; K</kbd></button><button className="icon-button theme-toggle" title={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'} aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17}/></button><span className="toolbar-divider"/>
          <button className={`icon-button notification-trigger ${!notificationsRead ? 'unread' : ''}`} title="Notifications" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Icon name="bell" size={18}/></button><button className="avatar top-avatar" aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}>IA</button>
          {notificationsOpen && <div className="popover notifications-popover"><div className="popover-title"><h3>Notifications</h3><button className="text-button" onClick={() => setNotificationsRead(true)}>{notificationsRead ? 'All read' : 'Mark all read'}</button></div><button className="notification-item" onClick={() => { navigate('Tasks'); setNotificationsOpen(false); }}><span className="notification-icon danger"><Icon name="clock" size={17}/></span><span><strong>{overdue ? `${overdue} tasks need your attention` : 'You are all caught up'}</strong><small>{overdue ? 'A quick check-in on overdue admin tasks.' : 'No overdue tasks in your workspace.'}</small><time>Sample workspace</time></span></button><button className="notification-item" onClick={() => { setEventDetail(events[0]); setNotificationsOpen(false); }}><span className="notification-icon"><Icon name="calendar" size={17}/></span><span><strong>AI Builder School is coming up</strong><small>Monday, Oct 5 at 10:00 AM</small><time>Illustrative calendar reminder</time></span></button><div className="popover-bottom">Local reminders &middot; no live integrations</div></div>}
          {profileOpen && <div className="popover profile-popover">
            <div className="profile-menu-heading"><strong>Ibn Ahmad ar-Raqmi</strong><small>Personal workspace</small></div>
            <button onClick={() => { setSettings(true); setProfileOpen(false); }}><Icon name="settings" size={15}/>Settings</button>
            <button onClick={() => { exportWorkspace(); setProfileOpen(false); }}><Icon name="download" size={15}/>Export workspace</button>
            <button onClick={() => void saveScreenshot()} disabled={screenshotBusy}><Icon name="file" size={15}/>{screenshotBusy ? 'Preparing screenshot...' : 'Save screenshot'}</button>
            <button onClick={() => { setHelp(true); setProfileOpen(false); }}><Icon name="help" size={15}/>Keyboard shortcuts</button>
          </div>}
        </div>
      </header>
      <main className="main-content" id="main-content" ref={mainRef}>
        <div className="page-content">
          <div className="page-heading"><div><div className="page-title-row"><h1>{projectFilter || page}</h1><button className="sample-label" title="Metrics, tasks, and events are illustrative placeholders. Edits are stored on this device." onClick={() => setHelp(true)}><span className="tiny-dot"/>Sample workspace</button></div><p>{projectFilter ? `Keep your ${projectFilter} work moving forward.` : pageDescriptions[page]}</p></div><div className="page-heading-actions"><span className="sample-date"><Icon name="calendar" size={14}/>Sunday, October 4</span><button className={`icon-button refresh-button ${refreshing ? 'refreshing' : ''}`} title="Refresh workspace" aria-label="Refresh workspace" onClick={refresh} disabled={refreshing}><Icon name="refresh" size={15}/></button>{page === 'Notes' ? <button className="button primary" onClick={() => setNoteEditor('new')}><Icon name="plus" size={15}/>New note</button> : page === 'Files' ? <button className="button primary" onClick={() => fileInput.current?.click()}><Icon name="upload" size={15}/>Add files</button> : <button className="button primary" onClick={() => setNewTask(true)}><Icon name="plus" size={15}/>New task</button>}</div></div>
          <div className={`content-grid ${activeTask ? 'has-task-detail' : ''}`}>
            <div className="primary-content" key={page + (projectFilter || '')}>
              {page === 'Overview' && <>
                <section className="metrics-row" aria-label="Weekly key metrics, sample data">
                  <div className="metric primary-metric"><div className="metric-label">Tasks completed<Icon name="tasks" size={14}/></div><div className="metric-number" title={`${completedCount} completed out of ${totalCount} planned tasks this sample week`}>{completedCount}<span>/ {totalCount}</span><Sparkline data={completedWeek.map((value, index) => value + (index === 6 ? completedDelta : 0))} unit="tasks"/></div><div className="metric-change"><Icon name="upRight" size={12}/><strong>+{completedCount - 18}</strong><span>vs. last week</span></div></div>
                  <div className="metric"><div className="metric-label">Focus time<Icon name="clock" size={14}/></div><div className="metric-number focus-number" title="18 hours and 42 minutes of sample focus time"><span className="number-group">18<span>h</span>42<span>m</span></span><Sparkline data={focusWeek} unit="hours"/></div><div className="metric-change"><Icon name="upRight" size={12}/><strong>12.4%</strong><span>vs. last week</span></div></div>
                  <div className="metric"><div className="metric-label">Goal progress<Icon name="flag" size={14}/></div><div className="metric-number" title={`Average progress across ${goals.length} learning and project goals`}>{totalProgress}<span className="percentage-symbol">%</span><svg className="metric-ring" width="38" height="38" viewBox="0 0 38 38" aria-label={`${totalProgress}% complete`}><circle cx="19" cy="19" r="15" fill="none" stroke="var(--bg2)" strokeWidth="3"/><circle cx="19" cy="19" r="15" fill="none" stroke="var(--aqua)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${totalProgress * 0.9425} 94.25`} transform="rotate(-90 19 19)"/></svg></div><div className="metric-change neutral-change"><span className="tiny-dot"/><strong>{goals.length} goals</strong><span>on track</span></div></div>
                </section>
                <FocusChart refreshKey={refreshKey} reducedMotion={reducedMotion} completedDelta={completedDelta} theme={theme} onReport={(metric, range) => setReport({ metric, range })}/>
                <TaskTable tasks={tasks} onToggle={toggleTask} onSelect={t => setSelectedTask(t.id)} onAdd={() => setNewTask(true)} projectFilter={null} selectedId={selectedTask || undefined} onViewAll={() => navigate('Tasks')} onNotice={notify}/>
                <div className="bottom-split"><section className="goals-summary"><div className="section-heading"><h2>Goals in motion</h2><button className="icon-button compact" title="View goals" aria-label="View goals" onClick={() => navigate('Goals')}><Icon name="upRight" size={15}/></button></div>{goals.map(goal => <button className="goal-summary-item" key={goal.id} onClick={() => navigate('Goals')} title={`${goal.completed} of ${goal.total} milestones complete`}><span><strong><i style={{ background: goal.color }}/>{goal.name}</strong><small>{Math.round(goal.completed / goal.total * 100)}%</small></span><span className="goal-progress-track"><span style={{ width: `${goal.completed / goal.total * 100}%`, background: goal.color }}/></span></button>)}</section><section className="pinned-notes"><div className="section-heading"><h2>Pinned notes</h2><button className="icon-button compact" title="View all notes" aria-label="View all notes" onClick={() => navigate('Notes')}><Icon name="upRight" size={15}/></button></div>{notes.filter(n => n.pinned).slice(0, 3).map(note => <button key={note.id} className="pinned-note" onClick={() => setNoteEditor(note)} title={note.title}><Icon name="notes" size={14}/><span>{note.title}</span><small>{note.updated}</small></button>)}{!notes.some(n => n.pinned) && <p className="muted-note">Pin a note to keep it close.</p>}</section></div>
              </>}
              {page === 'Tasks' && <TaskTable tasks={tasks} onToggle={toggleTask} onSelect={t => setSelectedTask(t.id)} onAdd={() => setNewTask(true)} full projectFilter={projectFilter} selectedId={selectedTask || undefined} onViewAll={() => navigate('Tasks')} onNotice={notify}/>}
              {page === 'Calendar' && <CalendarView onEvent={setEventDetail}/>}
              {page === 'Notes' && <section className="notes-view"><div className="section-heading"><h2>All notes <span className="inline-count">{notes.length}</span></h2><div className="inline-search"><Icon name="search" size={14}/><input aria-label="Search notes" placeholder="Find a note..." value={noteQuery} onChange={e => setNoteQuery(e.target.value)}/></div></div><div className="notes-list">{notes.filter(n => `${n.title} ${n.text}`.toLowerCase().includes(noteQuery.toLowerCase())).map(note => <button className="note-list-item" onClick={() => setNoteEditor(note)} key={note.id}><Icon name="notes" size={21}/><span><strong>{note.title}{note.pinned && <Icon name="pin" size={12}/>}</strong><p>{note.text.replace(/\n+/g, ' ')}</p><small>Edited {note.updated} &middot; Local note</small></span><Icon name="right" size={15}/></button>)}{!notes.filter(n => `${n.title} ${n.text}`.toLowerCase().includes(noteQuery.toLowerCase())).length && <div className="empty-state"><Icon name="notes" size={30}/><h3>{noteQuery ? 'No matching notes' : 'A blank page is a beginning'}</h3><p>{noteQuery ? 'Try another word or clear your search.' : 'Capture a thought using the New note button.'}</p></div>}</div></section>}
              {page === 'Goals' && <GoalsView goals={goals} onChange={setGoals}/>}
              {page === 'Spiritual' && <div className="spiritual-view"><div className="spiritual-date"><Icon name="moon" size={21}/><span>22 Rabi al-Thani 1448 AH<small>Sunday, October 4, 2026 &middot; Sample date</small></span></div><PrayerTimes expanded/><Verse full/><WorldClocks/></div>}
              {page === 'Files' && <section className="files-view"><div className="section-heading"><h2>Your files<span className="inline-count">{files.length}</span></h2><span className="view-footnote">Available for this session</span></div>{files.length ? <div className="file-list">{files.map(file => <div className="file-row" key={file.id}><Icon name="file" size={24}/><a href={file.url} download={file.name}><strong>{file.name}</strong><small>{file.type || 'File'} &middot; {(file.size / 1024).toFixed(1)} KB</small></a><span>{file.date}</span><a href={file.url} download={file.name} className="icon-button" title={`Download ${file.name}`}><Icon name="download" size={16}/></a><button className="icon-button" title={`Remove ${file.name}`} aria-label={`Remove ${file.name}`} onClick={() => { URL.revokeObjectURL(file.url); setFiles(files.filter(f => f.id !== file.id)); notify('File removed from this session'); }}><Icon name="trash" size={15}/></button></div>)}</div> : <button className="file-drop-zone" onClick={() => fileInput.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}><Icon name="files" size={32}/><strong>A little space for your work</strong><span>Drop files here, or click to browse.</span><small>Files stay on your device and are available until you reload.</small></button>}</section>}
              {page === 'Authenticator' && <AuthenticatorView notify={notify}/>}
            </div>
            <aside className={`context-rail ${activeTask ? 'detail-rail' : ''}`} aria-label={activeTask ? 'Task details' : 'Daily context'}>{activeTask ? <TaskDetail task={activeTask} onClose={() => setSelectedTask(null)} onUpdate={updateTask} onDelete={id => setConfirmDelete({ type: 'task', id })} onToggle={toggleTask}/> : <><div className="rail-date"><span><Icon name="sun" size={15}/>A Sunday in October</span><small>22 Rabi al-Thani 1448 AH</small></div>{page !== 'Spiritual' && <PrayerTimes/>}<EventList onEvent={setEventDetail} onCalendar={() => navigate('Calendar')}/>{page !== 'Spiritual' && <Verse/>}<div className="rail-bottom-note"><span className="tiny-dot"/>A little progress, every day.</div></>}</aside>
          </div>
          <footer className="workspace-footer"><span><i className={`tiny-dot ${storageAvailable ? '' : 'warning-dot'}`}/>{storageAvailable ? 'All changes saved locally' : 'Session only: browser storage unavailable'}</span><span>Made for a more intentional day<span className="footer-divider">/</span><span className="footer-brand">raqmi.</span></span></footer>
        </div>
      </main>
    </div>

    <input ref={fileInput} className="visually-hidden" type="file" multiple tabIndex={-1} aria-label="Choose files" onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }}/>
    <input ref={importInput} className="visually-hidden" type="file" accept="application/json,.json" tabIndex={-1} aria-label="Import a workspace" onChange={async e => { const input = e.target, file = input.files?.[0]; if (!file) return; try { const data: unknown = JSON.parse(await file.text()); if (!validWorkspace(data)) throw new Error('Invalid workspace'); setTasks(data.tasks); setNotes(data.notes); setGoals(data.goals); setSelectedTask(null); notify('Workspace imported successfully'); } catch { notify('Could not import. Choose a valid Raqmi workspace export.'); } input.value = ''; }}/>
    {newTask && <NewTaskModal onClose={() => setNewTask(false)} defaultProject={projectFilter} onSave={task => { setTasks(current => [...current, task]); setNewTask(false); notify('Task created'); }}/>} 
    {noteEditor && <NoteModal key={noteEditor === 'new' ? 'new' : noteEditor.id} note={noteEditor === 'new' ? null : noteEditor} onClose={() => setNoteEditor(null)} notify={notify} onSave={note => { setNotes(current => current.some(n => n.id === note.id) ? current.map(n => n.id === note.id ? note : n) : [note, ...current]); setNoteEditor(null); notify('Note saved'); }} onDelete={id => setConfirmDelete({ type: 'note', id })}/>}
    {eventDetail && <Modal title="Event details" onClose={() => setEventDetail(null)}><div className="event-modal-body"><span className="sample-detail">ILLUSTRATIVE CALENDAR ENTRY</span><h3>{eventDetail.title}</h3><div className="event-meta"><span><Icon name="calendar" size={16}/>{new Date(`${eventDetail.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span><span><Icon name="clock" size={16}/>{eventDetail.time} MYT &middot; {eventDetail.duration} minutes</span><span><Icon name="location" size={16}/>{eventDetail.group}</span></div><p>{eventDetail.description}</p></div><div className="modal-footer"><span>Not a verified event listing</span><button className="button primary" onClick={() => addCalendarEvent(eventDetail)}><Icon name="download" size={14}/>Add to calendar</button></div></Modal>}
    {report && <Modal title={report.metric === 'focus' ? 'Focus time report' : 'Task completion report'} onClose={() => setReport(null)} className="report-modal">
      <div className="form-body"><p className="report-intro">Illustrative data for {report.range === '7' ? 'September 28 - October 4, 2026' : `the last ${report.range} days ending October 4, 2026`}. {report.range === '90' ? 'Weekly aggregates. ' : ''}This report is not connected to a live tracker.</p><div className="report-table-scroll"><table className="report-table"><thead><tr><th>Date</th><th>This period</th><th>Previous period</th></tr></thead><tbody>{getChartData(report.range, report.metric, completedDelta).labels.map((label, i) => { const data = getChartData(report.range, report.metric, completedDelta); return <tr key={label}><td>{label}</td><td>{data.current[i]} {report.metric === 'focus' ? 'h' : 'tasks'}</td><td>{data.previous[i]} {report.metric === 'focus' ? 'h' : 'tasks'}</td></tr>; })}</tbody></table></div></div>
      <div className="modal-footer"><span>Sample data only</span><button className="button primary" onClick={() => { const d = getChartData(report.range, report.metric, completedDelta); downloadFile(['Date,This period,Previous period', ...d.labels.map((l, i) => `"${l}",${d.current[i]},${d.previous[i]}`)].join('\n'), `raqmi-${report.metric}-sample.csv`, 'text/csv'); notify('Report downloaded'); }}><Icon name="download" size={14}/>Export CSV</button></div>
    </Modal>}
    {settings && <Modal title="Workspace settings" onClose={() => setSettings(false)}><div className="settings-body"><div className="settings-group"><span className="eyebrow">APPEARANCE</span><div className="setting-row"><span><strong>Appearance</strong><small>Everforest &middot; medium contrast</small></span><div className="theme-segment" role="group" aria-label="Color theme"><button type="button" className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Icon name="sun" size={14}/>Light</button><button type="button" className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Icon name="moon" size={14}/>Dark</button></div></div><div className="setting-row"><span><strong>Compact density</strong><small>A little more information, a little less space.</small></span><button className={`toggle-switch ${compact ? 'on' : ''}`} role="switch" aria-checked={compact} aria-label="Compact density" onClick={() => setCompact(!compact)}><span/></button></div><div className="setting-row"><span><strong>Reduce motion</strong><small>Keep transitions and chart animations still.</small></span><button className={`toggle-switch ${reducedMotion ? 'on' : ''}`} role="switch" aria-checked={reducedMotion} aria-label="Reduce motion" onClick={() => setReducedMotion(!reducedMotion)}><span/></button></div></div><div className="settings-group"><span className="eyebrow">YOUR DATA</span><p className="settings-description">Tasks, notes, and goals are stored in this browser. No account, analytics, or server connection is required. Files and authenticator secrets are session-only.</p><div className="settings-data-actions"><button className="button" onClick={exportWorkspace}><Icon name="download" size={14}/>Export JSON</button><button className="button" onClick={() => importInput.current?.click()}><Icon name="upload" size={14}/>Import JSON</button></div><button className="text-button danger-button reset-button" onClick={() => setConfirmDelete({ type: 'reset', id: '' })}>Reset sample workspace</button></div></div><div className="modal-footer"><span>Changes apply immediately</span><button className="button primary" onClick={() => setSettings(false)}>Done</button></div></Modal>}
    {help && <Modal title="A calmer place to get things done" onClose={() => setHelp(false)}><div className="form-body"><p className="help-intro">Raqmi is a local-first personal workspace. This edition uses clearly marked, realistic placeholder data, anchored to October 4, 2026. Nothing is connected to a live account.</p><h3 className="help-heading">A few helpful shortcuts</h3><div className="shortcut-list"><div><span>Search your workspace</span><kbd>Ctrl / &#8984; K</kbd></div><div><span>Collapse or expand navigation</span><kbd>Ctrl / &#8984; B</kbd></div><div><span>Create a new task</span><kbd>N</kbd></div><div><span>Capture a note</span><kbd>Q</kbd></div><div><span>Search from anywhere</span><kbd>/</kbd></div><div><span>Close a dialog</span><kbd>Esc</kbd></div><div><span>Inspect a focused chart</span><kbd>&larr; &rarr;</kbd></div></div><p className="help-storage">Your changes stay on this device. Export a workspace backup from Settings. Prayer schedules and calendar entries are illustrative; always consult a verified source.</p></div><div className="modal-footer"><span>Everforest &middot; Inter &middot; JetBrains Mono</span><button className="button primary" onClick={() => setHelp(false)}>Back to work</button></div></Modal>}
    {searchOpen && <Modal title="Search workspace" onClose={() => setSearchOpen(false)} className="search-modal"><div className="command-input"><Icon name="search" size={20}/><input autoFocus aria-label="Search tasks, notes, and pages" placeholder="Find a task, note, or page..." value={search} onChange={e => { setSearch(e.target.value); setSearchIndex(0); }} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(i => Math.max(0, Math.min(i + 1, searchResults.length - 1))); } if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(i => Math.max(i - 1, 0)); } if (e.key === 'Enter' && searchResults[searchIndex]) { searchResults[searchIndex].action(); setSearchOpen(false); } }}/><button className="search-close-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><kbd>Esc</kbd></button></div><div className="command-results"><span className="menu-label">{search ? `${searchResults.length} RESULTS` : 'QUICK ACCESS'}</span>{searchResults.map((result, index) => <button key={result.id} className={`command-result ${index === searchIndex ? 'selected' : ''}`} onMouseEnter={() => setSearchIndex(index)} onClick={() => { result.action(); setSearchOpen(false); }}><Icon name={result.icon} size={17}/><span><strong>{result.title}</strong><small>{result.kind}</small></span><Icon name="right" size={14}/></button>)}{!searchResults.length && <div className="empty-state compact-empty"><p>No matches for &ldquo;{search}&rdquo;.</p></div>}</div><div className="command-footer"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to navigate</span><span><kbd>Enter</kbd> to open</span><span>Search stays on your device</span></div></Modal>}
    {confirmDelete && <Modal title={confirmDelete.type === 'reset' ? 'Reset this workspace?' : `Delete this ${confirmDelete.type}?`} onClose={() => setConfirmDelete(null)} className="confirm-modal"><div className="form-body"><p className="confirmation-copy">{confirmDelete.type === 'reset' ? 'Your edited tasks, notes, and goals will be replaced by the original sample data. Export a backup from Settings first if you want to keep your changes.' : 'This will remove the item from your local workspace. This action cannot be undone.'}</p></div><div className="modal-footer"><button className="button" onClick={() => setConfirmDelete(null)}>Keep {confirmDelete.type === 'reset' ? 'my changes' : confirmDelete.type}</button><button className="button danger-action" onClick={() => { if (confirmDelete.type === 'task') { setTasks(current => current.filter(t => t.id !== confirmDelete.id)); setSelectedTask(null); } else if (confirmDelete.type === 'note') { setNotes(current => current.filter(n => n.id !== confirmDelete.id)); setNoteEditor(null); } else { setTasks(initialTasks); setNotes(initialNotes); setGoals(initialGoals); setSelectedTask(null); } notify(confirmDelete.type === 'reset' ? 'Sample workspace restored' : `${confirmDelete.type === 'task' ? 'Task' : 'Note'} deleted`); setConfirmDelete(null); }}>{confirmDelete.type === 'reset' ? 'Reset workspace' : 'Delete'}</button></div></Modal>}
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <><Icon name="check" size={16}/><span>{toast}</span><button className="icon-button compact" aria-label="Dismiss notification" onClick={() => setToast('')}><Icon name="close" size={13}/></button></>}</div>
  </div>;
}
