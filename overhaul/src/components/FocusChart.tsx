import Chart from 'chart.js/auto';
import type { ChartConfiguration, Plugin } from 'chart.js';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useStore, type Completion, type TaskView } from '../store';
import { addDays, downloadFile, parseDateKey, toDateKey, todayKey } from '../utils/date';
import { Icon } from './Icon';
import { Modal } from './Modal';

export type Theme = 'dark' | 'light';
export type Metric = 'completed' | 'created';
export type Range = '7' | '30' | '90';

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

/** Per-day counts of the chosen metric, keyed by local date. */
export function dailyCounts(metric: Metric, tasks: TaskView[], completions: Completion[]) {
  const counts = new Map<string, number>();
  const dates = metric === 'completed' ? completions.map(c => c.date) : tasks.map(t => (t.createdAt ? toDateKey(new Date(t.createdAt)) : null));
  for (const d of dates) if (d) counts.set(d, (counts.get(d) || 0) + 1);
  return counts;
}

/** Current and previous period series. 90 days are bucketed into 13 weekly totals. */
export function activitySeries(range: Range, counts: Map<string, number>, today = todayKey()) {
  const buckets = range === '7' ? 7 : range === '30' ? 30 : 13, width = range === '90' ? 7 : 1, span = buckets * width;
  const sum = (end: string) => Array.from({ length: width }, (_, i) => counts.get(addDays(end, -i)) || 0).reduce((a, b) => a + b, 0);
  const ends = Array.from({ length: buckets }, (_, i) => addDays(today, -(buckets - 1 - i) * width));
  const fmt = (key: string, opts: Intl.DateTimeFormatOptions) => parseDateKey(key).toLocaleDateString('en-US', opts);
  return {
    labels: ends.map(end => range === '7' ? fmt(end, { weekday: 'short', month: 'short', day: 'numeric' }) : range === '90' ? `Week of ${fmt(addDays(end, -6), { month: 'short', day: 'numeric' })}` : fmt(end, { month: 'short', day: 'numeric' })),
    current: ends.map(sum),
    previous: ends.map(end => sum(addDays(end, -span))),
    start: addDays(today, -span + 1),
    end: today,
  };
}

const rangeLabel = (range: Range) => range === '7' ? 'Last 7 days' : range === '30' ? 'Last 30 days' : 'Last 90 days / Weekly totals';
const unit = (metric: Metric) => (metric === 'completed' ? 'completed' : 'created');

export function FocusChart({ refreshKey, reducedMotion, theme, onReport }: { refreshKey: number; reducedMotion: boolean; theme: Theme; onReport: (metric: Metric, range: Range) => void }) {
  const tasks = useStore(s => s.tasks), completions = useStore(s => s.completions);
  const canvas = useRef<HTMLCanvasElement>(null), chartRef = useRef<Chart<'line'> | null>(null);
  const [metric, setMetric] = useState<Metric>('completed'), [range, setRange] = useState<Range>('7'), [compare, setCompare] = useState(true), [loading, setLoading] = useState(true);
  const series = useMemo(() => activitySeries(range, dailyCounts(metric, tasks, completions)), [range, metric, tasks, completions]);
  useEffect(() => { setLoading(true); const timer = window.setTimeout(() => setLoading(false), refreshKey ? 480 : 300); return () => clearTimeout(timer); }, [refreshKey]);
  useEffect(() => {
    if (!canvas.current || loading) return;
    const data = series, context = canvas.current.getContext('2d'); if (!context) return;
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
          callbacks: { label: item => ` ${item.dataset.label}: ${item.raw} task${item.raw === 1 ? '' : 's'}` },
        } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: c.xTick, font: { family: 'Inter', size: 11 }, padding: 10, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, callback: (_, index) => range === '7' ? data.labels[index].split(',')[0] : data.labels[index].replace('Week of ', '') } },
          y: { beginAtZero: true, suggestedMax: range === '7' ? 4 : undefined, border: { display: false }, grid: { color: c.grid, drawTicks: false }, ticks: { color: c.yTick, font: { family: 'JetBrains Mono', size: 10 }, padding: 13, maxTicksLimit: 5, precision: 0 } },
        },
      }, plugins: [makeCrosshair(theme)],
    };
    const chart = new Chart(canvas.current, config); chartRef.current = chart;
    void document.fonts.ready.then(() => { if (chartRef.current === chart) chart.update('none'); });
    return () => { chart.destroy(); chartRef.current = null; };
  }, [series, range, compare, loading, reducedMotion, theme]);
  function chartKey(e: ReactKeyboardEvent<HTMLCanvasElement>) {
    const chart = chartRef.current; if (!chart || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault(); const current = chart.getActiveElements()[0]?.index ?? -1;
    const next = Math.max(0, Math.min((chart.data.labels?.length || 1) - 1, current + (e.key === 'ArrowRight' ? 1 : -1)));
    const active = chart.data.datasets.flatMap((_, datasetIndex) => chart.isDatasetVisible(datasetIndex) ? [{ datasetIndex, index: next }] : []);
    chart.setActiveElements(active); const point = chart.getDatasetMeta(0).data[next]; chart.tooltip?.setActiveElements(active, { x: point.x, y: point.y }); chart.update('none');
  }
  const sumCurrent = series.current.reduce((a, b) => a + b, 0), sumPrevious = series.previous.reduce((a, b) => a + b, 0), diff = sumCurrent - sumPrevious;
  const change = `${sumCurrent} task${sumCurrent === 1 ? '' : 's'} ${unit(metric)}`;
  const comparison = diff === 0 ? 'same as the previous period' : `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than ${range === '7' ? 'last week' : 'the previous period'}`;
  const span = `${parseDateKey(series.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${parseDateKey(series.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  return <section className="focus-panel" aria-label="Activity chart">
    <div className="panel-heading"><div><h2>Activity overview</h2><p>{span}{range === '90' ? ' / Weekly totals' : ''}</p></div><div className="select-wrap"><Icon name="calendar" size={14}/><select aria-label="Chart time range" value={range} onChange={e => setRange(e.target.value as Range)}><option value="7">This week</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><Icon name="down" size={13}/></div></div>
    <div className="chart-toolbar"><div className="chart-tabs" role="tablist" aria-label="Chart metric"><button className={metric === 'completed' ? 'active' : ''} onClick={() => setMetric('completed')} role="tab" aria-selected={metric === 'completed'}>Tasks completed</button><button className={metric === 'created' ? 'active' : ''} onClick={() => setMetric('created')} role="tab" aria-selected={metric === 'created'}>Tasks created</button></div><div className="chart-legend"><span><i className="legend-line current"/>{range === '7' ? 'This week' : 'This period'}</span><button className={!compare ? 'muted' : ''} onClick={() => setCompare(!compare)} title="Toggle previous-period comparison" aria-pressed={compare}><i className="legend-line previous"/>{range === '7' ? 'Last week' : 'Previous'}</button></div></div>
    <div className={`chart-canvas ${loading ? 'is-loading' : ''}`}>{loading ? <div className="chart-skeleton" aria-label="Loading activity data"><div/><div/><div/><div/></div> : <canvas ref={canvas} tabIndex={0} role="img" aria-label={`Tasks ${unit(metric)} per ${range === '90' ? 'week' : 'day'}, ${rangeLabel(range)}. Use left and right arrow keys to inspect data points.`} onKeyDown={chartKey}/>}</div>
    <div className="chart-foot"><span><Icon name="upRight" size={13}/><strong>{change}</strong><span className="foot-comparison">, {comparison}</span></span><button className="text-button" onClick={() => onReport(metric, range)}>View report<Icon name="right" size={13}/></button></div>
  </section>;
}

export function ReportModal({ metric, range, onClose, notify }: { metric: Metric; range: Range; onClose: () => void; notify: (message: string) => void }) {
  const tasks = useStore(s => s.tasks), completions = useStore(s => s.completions);
  const data = useMemo(() => activitySeries(range, dailyCounts(metric, tasks, completions)), [range, metric, tasks, completions]);
  const title = metric === 'completed' ? 'Task completion report' : 'Task creation report';
  return <Modal title={title} onClose={onClose} className="report-modal">
    <div className="form-body"><p className="report-intro">{rangeLabel(range)}, {parseDateKey(data.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} to {parseDateKey(data.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. {metric === 'completed' ? 'Counts one-off completions and completed occurrences of repeating tasks.' : 'Counts tasks still in your workspace by the day they were created.'}</p>
      <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Date</th><th>This period</th><th>Previous period</th></tr></thead><tbody>{data.labels.map((label, i) => <tr key={label}><td>{label}</td><td>{data.current[i]} tasks</td><td>{data.previous[i]} tasks</td></tr>)}</tbody></table></div></div>
    <div className="modal-footer"><span>From your workspace data</span><button className="button primary" onClick={() => { downloadFile(['Date,This period,Previous period', ...data.labels.map((l, i) => `"${l}",${data.current[i]},${data.previous[i]}`)].join('\n'), `raqmi-${metric}-${range}d.csv`, 'text/csv'); notify('Report downloaded'); }}><Icon name="download" size={14}/>Export CSV</button></div>
  </Modal>;
}
