/* ──────────────────────────────────────────────
   Add new pages here — just append an object.
   ────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    key: 'economy',
    label: 'Economy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v2m0 8v2M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2.5 3s-2.5 1.5-2.5 3a2.5 2.5 0 0 0 5 0" />
      </svg>
    ),
  },
  {
    key: 'players',
    label: 'Players',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'reviews',
    label: 'Reviews',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export default function Sidebar({ activePage, collapsed, onToggle, onNavigate }) {
  return (
    <aside className={`fixed inset-y-0 left-0 bg-admin-sidebar flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-[64px]' : 'w-[240px]'}`} id="sidebar">
      {/* Brand */}
      <div className={`flex items-center px-4 h-16 border-b border-admin-sidebar-border flex-shrink-0 overflow-hidden ${collapsed ? 'justify-center' : 'justify-start'}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-md bg-admin-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">A</div>
        ) : (
          <div className="w-full h-full py-3 flex items-center justify-center">
            <img src="/logo.png" alt="Algebrawl" className="h-full w-auto object-contain opacity-90" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            id={`nav-${item.key}`}
            className={`flex items-center px-3 py-2 rounded-md transition-colors overflow-hidden text-sm font-medium ${activePage === item.key ? 'bg-admin-sidebar-active text-admin-sidebar-text-active' : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-sidebar-text-active'}`}
            onClick={() => onNavigate(item.key)}
            title={collapsed ? item.label : undefined}
          >
            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{item.icon}</span>
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toggle */}
      <div className="p-2.5 border-t border-admin-sidebar-border">
        <button
          className={`flex items-center justify-center w-full p-2 text-admin-sidebar-text rounded-md hover:bg-admin-sidebar-hover hover:text-admin-sidebar-text-active transition-colors`}
          id="sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
