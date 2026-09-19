import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

/* ──────────────────────────────────────────────
   Admin Leaderboard — top players ranked by
   XP, Max Streak, and Online MMR.
   Read-only — no admin actions.
   ────────────────────────────────────────────── */

const TABS = [
  { key: 'xp', label: 'Top XP', field: 'xp', unit: 'XP' },
  { key: 'streak', label: 'Max Streak', field: 'max_streak', unit: 'wins' },
  { key: 'mmr', label: 'Online MMR', field: 'mmr', unit: 'MMR' },
];

const LEVEL_LABELS = ['—', 'Lv 1', 'Lv 2', 'Lv 3', 'Lv 4', 'Lv 5', 'Lv 6', 'Lv 7'];

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('xp');
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('id, username, ingame_name, xp, max_streak, mmr, online_wins, online_losses, unlocked_level, total_battles, wins')
        .not('username', 'is', null);

      setPlayers(data || []);
    } catch (err) {
      console.error('[Leaderboard] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const currentTab = TABS.find((t) => t.key === activeTab);

  const sorted = [...players].sort((a, b) => (b[currentTab.field] || 0) - (a[currentTab.field] || 0));

  const topValue = sorted[0]?.[currentTab.field] || 1;

  const RANK_LABELS = ['1st', '2nd', '3rd'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-admin-text">Leaderboard</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Top players across all registered accounts</p>
        </div>
        <button
          onClick={fetchPlayers}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-admin-border bg-admin-surface text-admin-text-secondary hover:bg-admin-surface-alt hover:text-admin-text transition-colors"
          id="leaderboard-refresh"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-admin-surface-alt p-1 rounded-lg border border-admin-border w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-admin-surface text-admin-text shadow-sm'
                : 'text-admin-text-muted hover:text-admin-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Podium — top 3 */}
      {!loading && sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[sorted[1], sorted[0], sorted[2]].map((player, podiumIdx) => {
            const rankIdx = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2;
            const heights = ['h-24', 'h-32', 'h-20'];
            const name = player?.ingame_name || player?.username || '—';
            const val = player?.[currentTab.field] ?? 0;
            const podiumColors = [
              'border-admin-warning/40 bg-amber-50',
              'border-admin-border bg-admin-surface-alt',
              'border-admin-border bg-admin-surface-alt',
            ];
            return (
              <div key={player?.id ?? podiumIdx} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-admin-surface-alt border border-admin-border flex items-center justify-center text-admin-text-secondary font-semibold text-sm">
                  {(name || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-admin-text truncate max-w-[100px]">{name}</div>
                  <div className="text-xs text-admin-text-muted">{val.toLocaleString()} {currentTab.unit}</div>
                </div>
                <div className={`w-full ${heights[rankIdx]} rounded-t-lg border ${podiumColors[rankIdx]} flex items-start justify-center pt-2`}>
                  <span className="text-xs font-semibold text-admin-text-secondary bg-admin-surface px-2 py-0.5 rounded-full border border-admin-border">{RANK_LABELS[rankIdx]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Ranked Table */}
      <div className="bg-admin-surface rounded-lg border border-admin-border overflow-hidden">
        <div className="p-5 border-b border-admin-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-admin-text">{currentTab.label} Rankings</h2>
          <span className="text-xs font-medium text-admin-text-muted bg-admin-surface-alt px-2.5 py-1 rounded-md border border-admin-border">
            {sorted.length} players
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-[3px] border-admin-border border-t-admin-primary rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-admin-text-muted text-sm">No players yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-admin-text whitespace-nowrap">
              <thead className="bg-admin-surface-alt text-admin-text-muted border-b border-admin-border uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-3 w-16 font-medium">Rank</th>
                  <th className="px-6 py-3 font-medium">Player</th>
                  <th className="px-6 py-3 font-medium">Level</th>
                  <th className="px-6 py-3 font-medium">Battles</th>
                  <th className="px-6 py-3 font-medium text-right">{currentTab.unit}</th>
                  <th className="px-6 py-3 font-medium text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {sorted.map((player, idx) => {
                  const name = player.ingame_name || player.username || 'Unknown';
                  const val = player[currentTab.field] || 0;
                  const pct = topValue > 0 ? Math.max(4, Math.round((val / topValue) * 100)) : 4;
                  return (
                    <tr key={player.id} className={`hover:bg-admin-surface-alt transition-colors ${idx < 3 ? 'font-semibold' : ''}`}>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${idx < 3 ? 'bg-admin-warning/10 text-admin-warning border border-admin-warning/20' : 'text-admin-text-muted'}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-admin-text">{name}</div>
                        <div className="text-xs text-admin-text-muted">@{player.username}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-admin-sidebar text-white">
                          {LEVEL_LABELS[player.unlocked_level || 1] ?? 'Lv 1'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-admin-text-secondary">{player.total_battles || 0}</td>
                      <td className="px-6 py-3 text-right font-semibold text-admin-text">{val.toLocaleString()}</td>
                      <td className="px-6 py-3 w-28">
                        <div className="h-1.5 bg-admin-surface-alt rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-admin-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
