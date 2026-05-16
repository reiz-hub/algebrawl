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
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 bg-game-text/5 blur-xl rounded-[2rem] transform -translate-y-2"></div>
        <div className="bg-game-cream-alt rounded-2xl shadow-xl border border-game-border p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-game-text"></div>
          
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-game-border/30 text-game-text flex items-center justify-center rounded-xl mb-4 text-3xl shadow-sm border border-game-border">
              🛡️
            </div>
            <h1 className="text-2xl font-black tracking-tight text-game-text">ALGEBRAWL</h1>
            <p className="text-sm font-bold text-game-muted tracking-widest mt-1">ADMIN PANEL</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-black text-game-muted uppercase tracking-wider mb-2">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-game-cream border border-game-border rounded-lg text-sm text-game-text font-bold focus:outline-none focus:ring-2 focus:ring-game-text focus:bg-game-cream-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-black text-game-muted uppercase tracking-wider mb-2">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-game-cream border border-game-border rounded-lg text-sm text-game-text font-bold focus:outline-none focus:ring-2 focus:ring-game-text focus:bg-game-cream-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div id="login-error" className="p-3 rounded-lg bg-game-red/10 border border-game-red/20 flex items-center gap-2">
                <svg className="w-5 h-5 text-game-red flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-sm text-game-red font-bold">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              id="admin-login-btn" 
              disabled={loading}
              className="w-full py-3 px-4 bg-game-text hover:bg-game-brown-lighter text-game-cream font-black rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-game-text focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>SIGNING IN...</span>
                </>
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-sm text-game-muted font-bold">Authorized access only</p>
    </div>
  );
}
