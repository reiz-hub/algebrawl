import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

/* ──────────────────────────────────────────────
   Admin Economy — coin circulation and
   item popularity overview.
   Reads from existing `users` table — no schema
   changes required.
   ────────────────────────────────────────────── */

const ALL_ITEMS = [
  // Gears
  { id: 'g1', name: 'No. 2 Pencil', icon: '✏️', category: 'Gear', detail: '+2s / Q' },
  { id: 'g2', name: 'Study Notes', icon: '📓', category: 'Gear', detail: '+1 Heart' },
  { id: 'g3', name: 'Math Ruler', icon: '📏', category: 'Gear', detail: '+4s / Q' },
  { id: 'g4', name: 'Pocket Calc', icon: '📱', category: 'Gear', detail: '+2 Hearts' },
  { id: 'g5', name: 'Golden Protractor', icon: '📐', category: 'Gear', detail: '2× XP' },
  // Skills
  { id: 's1', name: 'Basic Attack', icon: '⚔️', category: 'Skill', detail: 'Default' },
  { id: 's2', name: 'Focus', icon: '⏱️', category: 'Skill', detail: '+5s Timer' },
  { id: 's3', name: 'Shield', icon: '🛡️', category: 'Skill', detail: 'Block 1 Hit' },
  { id: 's4', name: 'Double Strike', icon: '🔥', category: 'Skill', detail: '2× Damage' },
  // Characters
  { id: 'char_algebro', name: 'Algebro', icon: '🧙', category: 'Character', detail: 'Default' },
  { id: 'c0', name: 'Starter Hero', icon: '🦸', category: 'Character', detail: 'Starter' },
  { id: 'char_algegal', name: 'Algegal', icon: '🎀', category: 'Character', detail: 'Default' },
  { id: 'c5', name: 'Starter Heroine', icon: '🎀', category: 'Character', detail: 'Starter' },
  { id: 'c1', name: 'Hero 2', icon: '🗡️', category: 'Character', detail: 'Unlockable' },
  { id: 'c2', name: 'Hero 3', icon: '🏹', category: 'Character', detail: 'Unlockable' },
  { id: 'c3', name: 'Hero 4', icon: '🔮', category: 'Character', detail: 'Unlockable' },
  { id: 'c4', name: 'Hero 5', icon: '⚡', category: 'Character', detail: 'Unlockable' },
];

const CATEGORY_COLORS = {
  Gear: 'bg-blue-50 text-admin-primary border-admin-primary/20',
  Skill: 'bg-red-50 text-admin-danger border-admin-danger/20',
  Character: 'bg-amber-50 text-admin-warning border-admin-warning/20',
};

export default function Economy() {
  const [stats, setStats] = useState(null);
  const [itemCounts, setItemCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, coins, inventory, skill_stocks')
        .not('username', 'is', null);

      if (!users) return;

      const totalCoins = users.reduce((s, u) => s + (u.coins || 0), 0);
      const avgCoins = users.length > 0 ? Math.round(totalCoins / users.length) : 0;

      // Richest player
      const richest = [...users].sort((a, b) => (b.coins || 0) - (a.coins || 0))[0];

      // Item ownership counts — tally across all inventories
      const countMap = {};
      users.forEach((u) => {
        const inv = u.inventory || [];
        inv.forEach((itemId) => {
          countMap[itemId] = (countMap[itemId] || 0) + 1;
        });
      });

      // Merge with item metadata
      const enriched = ALL_ITEMS.map((item) => ({
        ...item,
        owners: countMap[item.id] || 0,
      })).sort((a, b) => b.owners - a.owners);

      setItemCounts(enriched);

      // Total skill stocks in circulation
      let totalSkillStocks = 0;
      users.forEach((u) => {
        const stocks = u.skill_stocks || {};
        totalSkillStocks += Object.values(stocks).reduce((s, v) => s + (v || 0), 0);
      });

      setStats({
        totalCoins,
        avgCoins,
        richestName: richest?.ingame_name || richest?.username || '—',
        richestCoins: richest?.coins || 0,
        totalPlayers: users.length,
        totalSkillStocks,
      });
    } catch (err) {
      console.error('[Economy] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const maxOwners = itemCounts[0]?.owners || 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-[3px] border-admin-border border-t-admin-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-admin-text-muted">Loading economy data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-admin-text">Economy</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Coin circulation and item ownership across all players</p>
        </div>
        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-admin-border bg-admin-surface text-admin-text-secondary hover:bg-admin-surface-alt hover:text-admin-text transition-colors"
          id="economy-refresh"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-warning/20 flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-warning">{(stats?.totalCoins || 0).toLocaleString()}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">Total Coins</div>
          <div className="text-xs text-admin-text-muted mt-0.5">across all players</div>
        </div>
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-border flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-text">{(stats?.avgCoins || 0).toLocaleString()}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">Avg Coins / Player</div>
        </div>
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-danger/20 flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-danger">{(stats?.totalSkillStocks || 0).toLocaleString()}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">Skill Stocks</div>
          <div className="text-xs text-admin-text-muted mt-0.5">consumable charges held</div>
        </div>
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-success/20 flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-success">{(stats?.richestCoins || 0).toLocaleString()}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">Richest Player</div>
          <div className="text-xs text-admin-text-muted mt-0.5">{stats?.richestName ?? '—'}</div>
        </div>
      </div>

      {/* Item Popularity */}
      <div className="bg-admin-surface rounded-lg border border-admin-border overflow-hidden">
        <div className="p-5 border-b border-admin-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-admin-text">Item Ownership</h2>
            <p className="text-xs text-admin-text-muted mt-0.5">How many registered players own each item</p>
          </div>
          <span className="text-xs font-medium text-admin-text-muted bg-admin-surface-alt px-2.5 py-1 rounded-md border border-admin-border">
            {stats?.totalPlayers ?? 0} players
          </span>
        </div>

        <div className="p-5 space-y-3">
          {itemCounts.map((item) => {
            const pct = maxOwners > 0 ? Math.max(2, Math.round((item.owners / maxOwners) * 100)) : 2;
            const catColor = CATEGORY_COLORS[item.category] || 'bg-admin-surface-alt text-admin-text-muted border-admin-border';
            return (
              <div key={item.id} className="flex items-center gap-4">
                <span className="text-lg w-8 text-center flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-admin-text">{item.name}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${catColor}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-admin-text-muted">{item.detail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-admin-surface-alt rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-admin-success transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-admin-text-muted w-16 text-right flex-shrink-0">
                      {item.owners} / {stats?.totalPlayers ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {itemCounts.length === 0 && (
            <div className="text-center text-admin-text-muted text-sm py-8">No inventory data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
