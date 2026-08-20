import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sliders, Music4, Mic2, Library, Piano,
  AppWindow, Wrench, FolderKanban, Download, Settings as SettingsIcon,
  PanelLeftClose, PanelLeft, LogOut
} from 'lucide-react';
import StudioLogo from './StudioLogo';

const NAV = [
  { group: 'Studio', items: [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Studio', path: '/studio', icon: Sliders },
  ]},
  { group: 'Create', items: [
    { name: 'AI Generate', path: '/ai-generation', icon: Music4 },
    { name: 'Lyrics', path: '/lyrics', icon: Mic2 },
    { name: 'Voice Lab', path: '/voice-lab', icon: Mic2 },
  ]},
  { group: 'Library', items: [
    { name: 'Samples', path: '/samples', icon: Library },
    { name: 'Instruments', path: '/instruments', icon: Piano },
    { name: 'Mastering', path: '/mastering', icon: AppWindow },
  ]},
  { group: 'Manage', items: [
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Export', path: '/export', icon: Download },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ]},
];

const ICON_PROPS = { size: 18, strokeWidth: 1.75 };

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <aside className={`${collapsed ? 'w-[80px]' : 'w-[248px]'} shrink-0 h-screen sticky top-0 glass-strong border-r border-studio-border flex flex-col transition-all duration-300 z-30`}>
      <div className="px-4 py-5 border-b border-studio-border">
        <div className={collapsed ? 'grid place-items-center' : ''}>
          <StudioLogo collapsed={collapsed} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((section) => (
          <div key={section.group}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">{section.group}</p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-neon-cyan/10 text-neon-cyan'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-neon-cyan box-glow-cyan" />}
                    <Icon {...ICON_PROPS} className={`shrink-0 ${active ? 'text-neon-cyan' : ''}`} />
                    {!collapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-studio-border space-y-1">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
        >
          {collapsed ? <PanelLeft size={18} /> : <><PanelLeftClose size={18} /> <span className="font-medium">Collapse</span></>}
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
        >
          <SettingsIcon size={18} />
          {!collapsed && <span className="font-medium">Preferences</span>}
        </button>
      </div>
    </aside>
  );
}