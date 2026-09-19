import { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Login() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error);
      }
      // On success the AdminAuthContext sets admin → App re-renders to dashboard
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm">
        <div className="bg-admin-surface rounded-lg shadow-lg p-8 border border-admin-border">
          
          <div className="text-center mb-8">
            <div className="mx-auto w-48 h-auto flex items-center justify-center mb-3">
              <img src="/logo.png" alt="Algebrawl" className="w-full h-auto object-contain" />
            </div>
            <p className="text-xs font-medium tracking-widest uppercase text-admin-text-muted">Administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-admin-text mb-1.5">Email address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-admin-border bg-admin-bg rounded-md text-sm text-admin-text placeholder-admin-text-muted/60 focus:outline-none focus:ring-2 focus:ring-admin-primary/30 focus:border-admin-primary transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-admin-text mb-1.5">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-admin-border bg-admin-bg rounded-md text-sm text-admin-text placeholder-admin-text-muted/60 focus:outline-none focus:ring-2 focus:ring-admin-primary/30 focus:border-admin-primary transition-colors disabled:opacity-60"
              />
            </div>

            {error && (
              <div id="login-error" className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2">
                <svg className="w-4 h-4 text-admin-danger flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-sm text-admin-danger font-medium">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              id="admin-login-btn" 
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-admin-primary hover:bg-admin-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-6 text-xs text-admin-text-muted">Authorized access only</p>
    </div>
  );
}
