import { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Reviews from './pages/Reviews';
import Leaderboard from './pages/Leaderboard';
import Economy from './pages/Economy';
import Sidebar from './components/Sidebar';

/* ──────────────────────────────────────────────
   Page registry — maps sidebar keys to components.
   To add a new page, add it here and in Sidebar's
   NAV_ITEMS array.
   ────────────────────────────────────────────── */
const PAGES = {
  dashboard: Dashboard,
  players: Players,
  reviews: Reviews,
  leaderboard: Leaderboard,
  economy: Economy,
};

function AppShell() {
  const { admin, loading, logout } = useAdminAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-admin-bg gap-4">
        <div className="w-8 h-8 border-[3px] border-admin-border border-t-admin-primary rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-admin-text-muted tracking-wide">Loading...</p>
      </div>
    );
  }

  if (!admin) return <Login />;

  const ActivePage = PAGES[activePage];

  return (
    <div className="flex min-h-screen bg-admin-bg font-sans text-admin-text transition-all duration-300">
      <Sidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={setActivePage}
      />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-[64px]' : 'ml-[240px]'}`}>
        <nav className="flex items-center justify-between px-8 py-4 bg-admin-surface border-b border-admin-border sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-admin-text">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-admin-text-secondary bg-admin-surface-alt px-3 py-1.5 rounded-md border border-admin-border hidden sm:inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-admin-success"></span>
              {admin.email}
            </span>
            <button
              className="px-4 py-2 text-sm font-medium text-admin-text-secondary bg-admin-surface border border-admin-border rounded-md hover:bg-admin-surface-alt hover:text-admin-danger transition-colors focus:outline-none focus:ring-2 focus:ring-admin-danger/30 focus:ring-offset-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-text/40 backdrop-blur-sm transition-opacity">
          <div className="bg-admin-surface rounded-lg p-6 shadow-2xl max-w-sm w-full border border-admin-border">
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50 border border-red-100 mb-4">
                <svg className="h-5 w-5 text-admin-danger" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-admin-text mb-1">{confirmDialog.title}</h3>
              <p className="text-sm text-admin-text-secondary mb-6">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
              <button
                className="mt-3 inline-flex w-full justify-center rounded-md bg-admin-surface px-4 py-2 text-sm font-medium text-admin-text border border-admin-border hover:bg-admin-surface-alt sm:mt-0 sm:w-auto transition-colors"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                className="inline-flex w-full justify-center rounded-md bg-admin-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-500 sm:w-auto transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-danger"
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
