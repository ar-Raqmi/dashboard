import { Icon } from '@/components/Icon';
import { timeZone } from '@/lib/timezone';
import { useNow } from '@/lib/useNow';
import { EventList } from '@/features/calendar/EventList';
import { useWidgetVisible } from '@/features/overview/OverviewPage';
import { hijriLabel, PrayerTimes } from '@/features/spiritual/PrayerTimes';
import { Verse } from '@/features/spiritual/Verse';
import { TaskDetail } from '@/features/tasks/TaskDetail';
import { useStore, type EventView, type TaskView } from '@/store';
import type { Page } from './pages';

interface ContextRailProps {
  page: Page;
  activeTask?: TaskView;
  onCloseTask: () => void;
  onDeleteTask: (task: TaskView) => void;
  onOpenEvent: (event: EventView) => void;
  onOpenCalendar: () => void;
  notify: (message: string) => void;
}

export function ContextRail({ page, activeTask, onCloseTask, onDeleteTask, onOpenEvent, onOpenCalendar, notify }: ContextRailProps) {
  const widgetVisible = useWidgetVisible();
  const prayer = useStore(s => s.prayer);
  const settings = useStore(s => s.settings);
  const now = useNow(30_000);
  const hijri = hijriLabel(prayer, settings, now);

  return <aside className={`context-rail ${activeTask ? 'detail-rail' : ''}`} aria-label={activeTask ? 'Task details' : 'Daily context'} tabIndex={activeTask ? 0 : undefined}>
    {activeTask
      ? <TaskDetail task={activeTask} onClose={onCloseTask} onDelete={onDeleteTask} onNotice={notify}/>
      : <>
        <div className="rail-date"><span><Icon name="sun" size={15}/>A {timeZone.format(now, { weekday: 'long' })} in {timeZone.format(now, { month: 'long' })}</span>{hijri && <small title={`Calendar: ${prayer?.hijri?.source}`}>{hijri}</small>}</div>
        {page !== 'Spiritual' && widgetVisible('prayerTimes') && <PrayerTimes/>}
        {widgetVisible('calendar') && <EventList onEvent={onOpenEvent} onCalendar={onOpenCalendar}/>}
        {page !== 'Spiritual' && page !== 'Overview' && widgetVisible('verse') && <Verse/>}
        <div className="rail-bottom-note"><span className="tiny-dot"/>A little progress, every day.</div>
      </>}
  </aside>;
}
