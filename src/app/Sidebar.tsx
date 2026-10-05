import { useEffect, useRef, useState } from 'react';
import { AvatarContent } from '@/components/Avatar';
import { BrandMark, Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth/auth';
import { initialsOf } from '@/lib/text';
import { todayKey } from '@/lib/date';
import { exportWorkspace } from '@/lib/workspaceExport';
import { isActionable, useStore } from '@/store';
import { pageLabel, personalNav, workspaceNav, type NavItem, type Page } from './pages';

interface SidebarProps {
  page: Page;
  collapsed: boolean;
  onNavigate: (page: Page) => void;
  onToggleCollapsed: () => void;
  onQuickCapture: () => void;
  onExported: () => void;
}

export function Sidebar({ page, collapsed, onNavigate, onToggleCollapsed, onQuickCapture, onExported }: SidebarProps) {
  const { user } = useAuth();
  const settings = useStore(s => s.settings);
  const tasks = useStore(s => s.tasks);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onMouseDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('mousedown', onMouseDown); };
  }, []);

  const today = todayKey();
  const openTasks = tasks.filter(t => isActionable(t, today)).length;
  const appLogo = settings?.appLogo || '';
  const logoStyle = appLogo ? { background: settings?.iconBackgroundColor, overflow: 'hidden' } : undefined;
  const workspaceName = settings?.appTitle && settings.appTitle !== 'Dashboard' ? settings.appTitle : 'Personal workspace';
  const profileName = settings?.profileName || user?.username || '';
  const avatar = <span className="workspace-avatar" style={logoStyle}><AvatarContent src={appLogo} fallback={initialsOf(profileName)}/></span>;

  const navigate = (next: Page) => { setMenuOpen(false); onNavigate(next); };
  const navButton = (item: NavItem, badge?: number) => <button key={item.name} className={`nav-item ${page === item.name ? 'active' : ''}`} onClick={() => navigate(item.name)} title={pageLabel(item.name)} aria-current={page === item.name ? 'page' : undefined}>
    <Icon name={item.icon} size={18}/><span>{pageLabel(item.name)}</span>{badge !== undefined && <small>{badge}</small>}
  </button>;

  return <aside className="sidebar" aria-label="Main navigation">
    <div className="brand-row">
      <button className="brand" onClick={() => navigate('Overview')} aria-label="Raqmi overview"><BrandMark/><span>raqmi<span className="brand-period">.</span></span></button>
      <button className="collapse-button icon-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`} onClick={onToggleCollapsed}><Icon name="collapse" size={17}/></button>
    </div>
    <div className="workspace-switcher-wrap" ref={menuRef}>
      <button className="workspace-switcher" onClick={() => setMenuOpen(!menuOpen)} title={settings?.appTitle || 'Personal workspace'} aria-expanded={menuOpen}>
        {avatar}<span className="workspace-text"><strong>{workspaceName}</strong><small>A space for your every day</small></span><Icon name="down" size={13}/>
      </button>
      {menuOpen && <div className="popover workspace-menu">
        <span className="menu-label">YOUR WORKSPACE</span>
        <div className="workspace-menu-current">{avatar}<span>{workspaceName}<small>Signed in as {user?.username}</small></span><Icon name="check" size={14}/></div>
        <button onClick={() => navigate('Settings')}><Icon name="settings" size={15}/>Workspace settings</button>
        <button onClick={() => { exportWorkspace(); onExported(); setMenuOpen(false); }}><Icon name="download" size={15}/>Export workspace</button>
      </div>}
    </div>
    <div className="sidebar-scroll">
      <div className="nav-section-label">WORKSPACE</div>
      <nav className="main-nav">{workspaceNav.map(item => navButton(item, item.name === 'Tasks' ? openTasks : undefined))}</nav>
      <div className="nav-section-label personal-section-label">PERSONAL</div>
      <nav>{personalNav.map(item => navButton(item))}</nav>
    </div>
    <div className="sidebar-bottom">
      <button className="quick-capture" title="Quick capture (Q)" onClick={onQuickCapture}><Icon name="plus" size={16}/><span>Quick capture</span><kbd>Q</kbd></button>
      <div className="sidebar-profile"><div><strong>{profileName}</strong><span>@{user?.username}</span></div></div>
    </div>
  </aside>;
}
