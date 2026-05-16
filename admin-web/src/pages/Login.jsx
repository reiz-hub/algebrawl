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
    <div className="min-h-screen bg-game-cream flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-game-cream-alt rounded-lg shadow-xl p-8 border border-game-border/30">
          
          <div className="text-center mb-8">
            <div className="mx-auto w-56 h-auto flex items-center justify-center mb-2">
              <img src="/logo.png" alt="Algebrawl" className="w-full h-auto object-contain drop-shadow-sm" />
            </div>
            <p className="text-sm font-bold tracking-widest uppercase text-game-muted">Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-game-text mb-1">Email address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-game-border/50 bg-game-cream rounded-md shadow-sm placeholder-game-muted/50 text-game-text focus:outline-none focus:ring-game-text focus:border-game-text sm:text-sm disabled:bg-game-cream disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-game-text mb-1">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-game-border/50 bg-game-cream rounded-md shadow-sm placeholder-game-muted/50 text-game-text focus:outline-none focus:ring-game-text focus:border-game-text sm:text-sm disabled:bg-game-cream disabled:opacity-60"
              />
            </div>

            {error && (
              <div id="login-error" className="p-3 rounded-md bg-game-red/10 border border-game-red/20 flex items-start gap-2">
                <svg className="w-5 h-5 text-game-red flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-sm text-game-red font-medium">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              id="admin-login-btn" 
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-game-cream bg-game-text hover:bg-game-brown-lighter focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-game-text disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-game-cream" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <p className="mt-8 text-sm text-game-muted">Authorized access only</p>
    </div>
  );
}
