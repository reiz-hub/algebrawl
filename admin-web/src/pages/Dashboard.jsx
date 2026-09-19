import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

/* ──────────────────────────────────────────────
   Admin Dashboard — at-a-glance system overview.
   All data is pulled directly from existing
   `users` and `reviews` Supabase tables.
   No schema changes required.
   ────────────────────────────────────────────── */

const LEVEL_NAMES = {
  1: 'Variables & Expressions',
  2: 'Equations & Inequalities',
  3: 'Polynomials',
  4: 'Factoring',
  5: 'Systems of Equations',
  6: 'Exponents & Roots',
  7: 'Random Mode',
};

const STAT_CONFIGS = [
  { key: 'totalPlayers', label: 'Registered', color: 'admin-text', borderColor: 'border-admin-border' },
  { key: 'activeCount', label: 'Active', color: 'admin-success', borderColor: 'border-admin-success/20' },
  { key: 'totalBattles', label: 'Total Battles', color: 'admin-primary', borderColor: 'border-admin-primary/20' },
  { key: 'avgWinRate', label: 'Avg Win Rate', color: 'admin-warning', borderColor: 'border-admin-warning/20', suffix: '%' },
  { key: 'avgRating', label: 'Avg Rating', color: 'admin-danger', borderColor: 'border-admin-danger/20' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [levelFunnel, setLevelFunnel] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      // Fetch all registered users
      const { data: users } = await supabase
        .from('users')
        .select('id, username, ingame_name, xp, total_battles, wins, max_streak, mmr, unlocked_level, is_active, coins');

      // Fetch recent reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, username, rating, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (users) {
        const registered = users.filter((u) => !!u.username);
        const totalBattles = registered.reduce((s, u) => s + (u.total_battles || 0), 0);
        const totalWins = registered.reduce((s, u) => s + (u.wins || 0), 0);
        const avgWinRate = totalBattles > 0 ? ((totalWins / totalBattles) * 100).toFixed(1) : '—';

        // Level funnel — count how many players have reached or passed each level
        const funnel = Array.from({ length: 7 }, (_, i) => {
          const level = i + 1;
          const count = registered.filter((u) => (u.unlocked_level || 1) >= level).length;
          return { level, name: LEVEL_NAMES[level], count };
        });
        setLevelFunnel(funnel);

        // Top 5 by total battles
        const sorted = [...registered]
          .sort((a, b) => (b.total_battles || 0) - (a.total_battles || 0))
          .slice(0, 5);
        setTopPlayers(sorted);

        setStats({
          totalPlayers: registered.length,
          activeCount: registered.filter((u) => u.is_active !== false).length,
          totalBattles,
          avgWinRate,
          totalReviews: reviews?.length ?? 0,
          avgRating:
            reviews && reviews.length > 0
              ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
              : '—',
        });
      }

      setRecentReviews(
        (reviews || []).map((r) => ({
          ...r,
          createdAt: r.created_at,
        }))
      );
    } catch (err) {
      console.error('[Dashboard] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const maxFunnelCount = levelFunnel[0]?.count || 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-[3px] border-admin-border border-t-admin-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-admin-text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-admin-text">Dashboard</h1>
        <p className="text-sm text-admin-text-secondary mt-1">System overview — all registered players</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CONFIGS.map((cfg) => {
          let value = stats?.[cfg.key] ?? '—';
          if (cfg.suffix && value !== '—') value = `${value}${cfg.suffix}`;
          return (
            <div key={cfg.key} className={`bg-admin-surface rounded-lg p-5 border ${cfg.borderColor} flex flex-col justify-center`}>
              <div className={`text-2xl font-semibold text-${cfg.color}`}>{value}</div>
              <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">{cfg.label}</div>
              {cfg.key === 'avgRating' && <div className="text-xs text-admin-text-muted mt-0.5">from {recentReviews.length} reviews</div>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Completion Funnel */}
        <div className="bg-admin-surface rounded-lg border border-admin-border p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-admin-text">Level Completion Funnel</h2>
            <p className="text-xs text-admin-text-muted mt-0.5">Players who have reached each level</p>
          </div>
          <div className="space-y-3">
            {levelFunnel.map(({ level, name, count }) => {
              const pct = maxFunnelCount > 0 ? Math.round((count / maxFunnelCount) * 100) : 0;
              return (
                <div key={level} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-admin-text flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-admin-sidebar text-white text-[10px] font-semibold">{level}</span>
                      {name}
                    </span>
                    <span className="text-xs font-medium text-admin-text-muted">{count}</span>
                  </div>
                  <div className="h-1.5 bg-admin-surface-alt rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-admin-primary transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Most Active Players */}
        <div className="bg-admin-surface rounded-lg border border-admin-border overflow-hidden">
          <div className="p-5 border-b border-admin-border">
            <h2 className="text-sm font-semibold text-admin-text">Most Active Players</h2>
            <p className="text-xs text-admin-text-muted mt-0.5">By total battles played</p>
          </div>
          <div className="divide-y divide-admin-border">
            {topPlayers.length === 0 && (
              <div className="p-8 text-center text-admin-text-muted text-sm">No data yet</div>
            )}
            {topPlayers.map((player, idx) => {
              const name = player.ingame_name || player.username || 'Unknown';
              const winRate =
                player.total_battles > 0
                  ? `${((player.wins / player.total_battles) * 100).toFixed(0)}% WR`
                  : '0% WR';
              return (
                <div key={player.id} className="flex items-center gap-4 px-5 py-3 hover:bg-admin-surface-alt transition-colors">
                  <span className="w-6 h-6 rounded-full bg-admin-surface-alt border border-admin-border flex items-center justify-center text-xs font-semibold text-admin-text-secondary flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-admin-text truncate">{name}</div>
                    <div className="text-xs text-admin-text-muted">@{player.username}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-admin-text">{player.total_battles || 0}</div>
                    <div className="text-xs text-admin-text-muted">{winRate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-admin-surface rounded-lg border border-admin-border overflow-hidden">
        <div className="p-5 border-b border-admin-border">
          <h2 className="text-sm font-semibold text-admin-text">Recent Reviews</h2>
          <p className="text-xs text-admin-text-muted mt-0.5">Latest 5 player reviews</p>
        </div>
        {recentReviews.length === 0 ? (
          <div className="p-8 text-center text-admin-text-muted text-sm">No reviews yet</div>
        ) : (
          <div className="divide-y divide-admin-border">
            {recentReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-4 px-5 py-4 hover:bg-admin-surface-alt transition-colors">
                <div className="w-8 h-8 rounded-full bg-admin-surface-alt border border-admin-border flex items-center justify-center text-admin-text-secondary font-medium text-sm flex-shrink-0">
                  {(r.username || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-admin-text">{r.username || 'Guest'}</span>
                    <span className="inline-flex gap-0.5 text-sm">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={i < (r.rating || 0) ? 'text-admin-warning' : 'text-admin-border'}>★</span>
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-admin-text-muted mt-0.5 truncate">{r.comment || '—'}</p>
                </div>
                <div className="text-xs text-admin-text-muted flex-shrink-0">{formatDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
