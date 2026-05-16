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

  const [confirmDialog, setConfirmDialog] = useState(null);

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
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black tracking-tight text-game-text">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-game-muted bg-game-border/30 px-3 py-1.5 rounded-full hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-game-green animate-pulse"></span>
              {admin.email}
            </span>
            <button
              className="px-4 py-2 text-sm font-bold text-game-muted bg-game-cream-alt border border-game-border rounded-lg hover:bg-game-red/10 hover:text-game-red hover:border-game-red transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-game-red focus:ring-offset-1"
              id="admin-logout-btn"
              onClick={() => setConfirmDialog({
                title: 'Sign Out',
                message: 'Are you sure you want to sign out of the admin panel?',
                confirmLabel: 'Sign Out',
                action: logout
              })}
            >
              Log out
            </button>
          </div>
        </nav>
        <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
          <ActivePage />
        </main>
      </div>

      {/* Generic Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
              <button
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={() => {
                  confirmDialog.action();
                  setConfirmDialog(null);
                }}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
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
