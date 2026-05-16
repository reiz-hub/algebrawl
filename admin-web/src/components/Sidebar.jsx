/* ──────────────────────────────────────────────
   Add new pages here — just append an object.
   ────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    key: 'players',
    label: 'Players',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export default function Sidebar({ activePage, collapsed, onToggle, onNavigate }) {
  return (
    <aside className={`fixed inset-y-0 left-0 bg-game-brown border-r border-game-brown-lighter flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`} id="sidebar">
      {/* Brand */}
      <div className="flex items-center px-5 h-16 border-b border-game-brown-lighter flex-shrink-0 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-game-brown-light text-game-cream flex items-center justify-center font-black flex-shrink-0 shadow-sm border border-game-brown-light">A</div>
        <span className={`ml-3 font-black text-white tracking-wider whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>ALGEBRAWL</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            id={`nav-${item.key}`}
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors overflow-hidden font-bold ${activePage === item.key ? 'bg-game-brown-light text-game-cream' : 'text-game-muted hover:bg-game-brown-light hover:text-game-cream'}`}
            onClick={() => onNavigate(item.key)}
            title={collapsed ? item.label : undefined}
          >
            <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">{item.icon}</span>
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toggle */}
      <div className="p-3 border-t border-game-brown-lighter">
        <button
          className={`flex items-center justify-center w-full p-2.5 text-game-muted rounded-lg hover:bg-game-brown-light hover:text-game-cream transition-colors`}
          id="sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
