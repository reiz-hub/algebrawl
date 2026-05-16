import { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import Login from './pages/Login';
import Players from './pages/Players';
import Reviews from './pages/Reviews';
import Sidebar from './components/Sidebar';

/* ──────────────────────────────────────────────
   Page registry — maps sidebar keys to components.
   To add a new page, add it here and in Sidebar's
   NAV_ITEMS array.
   ────────────────────────────────────────────── */
const PAGES = {
  players: Players,
  reviews: Reviews,
};

function AppShell() {
  const { admin, loading, logout } = useAdminAuth();
  const [activePage, setActivePage] = useState('players');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-game-cream gap-5">
        <div className="w-10 h-10 border-4 border-game-border border-t-game-yellow rounded-full animate-spin"></div>
        <p className="text-sm font-black text-game-muted tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  if (!admin) return <Login />;

  const ActivePage = PAGES[activePage];

  return (
    <div className="flex min-h-screen bg-game-cream font-sans text-game-text transition-all duration-300">
      <Sidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={setActivePage}
      />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'}`}>
        <nav className="flex items-center justify-between px-8 py-4 bg-game-cream border-b border-game-border sticky top-0 z-50 shadow-sm">
          <h1 className="text-lg font-black tracking-tight text-game-text">Algebrawl Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-game-muted bg-game-border/30 px-3 py-1.5 rounded-full hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-game-green animate-pulse"></span>
              {admin.email}
            </span>
            <button
              className="px-4 py-2 text-sm font-bold text-game-muted bg-game-cream-alt border border-game-border rounded-lg hover:bg-game-red/10 hover:text-game-red hover:border-game-red transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-game-red focus:ring-offset-1"
              id="admin-logout-btn"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </nav>
        <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
          <ActivePage />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AppShell />
    </AdminAuthProvider>
  );
}
