import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { longDay, todayKey } from '@/lib/date';
import { useStore } from '@/store';
import { pageDescriptions, pageLabel, type Page } from './pages';

interface PageHeadingProps {
  page: Page;
  refreshing: boolean;
  onRefresh: () => void;
  action: ReactNode;
}

export function PageHeading({ page, refreshing, onRefresh, action }: PageHeadingProps) {
  const status = useStore(s => s.status);
  const saving = useStore(s => s.saving);
  const syncLabel = saving > 0 ? 'Saving...' : status === 'error' ? 'Offline' : status === 'loading' ? 'Loading...' : 'Synced';

  return <div className="page-heading">
    <div>
      <div className="page-title-row"><h1>{pageLabel(page)}</h1><button className="sample-label" title="Sync status. Click to refresh." onClick={onRefresh}><span className={`tiny-dot ${status === 'error' ? 'warning-dot' : ''}`}/>{syncLabel}</button></div>
      <p>{pageDescriptions[page]}</p>
    </div>
    <div className="page-heading-actions">
      <span className="sample-date"><Icon name="calendar" size={14}/>{longDay(todayKey())}</span>
      <button className={`icon-button refresh-button ${refreshing ? 'refreshing' : ''}`} title="Refresh workspace" aria-label="Refresh workspace" onClick={onRefresh} disabled={refreshing}><Icon name="refresh" size={15}/></button>
      {action}
    </div>
  </div>;
}
