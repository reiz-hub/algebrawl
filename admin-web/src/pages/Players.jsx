import { useEffect, useState, Fragment } from 'react';
import { supabase } from '../supabase';

const CHARACTERS = [
  { id: 'c0', altId: 'char_algebro', name: 'Algebro', stat: 'Balanced (3 Hearts)', icon: '🧮', unlockLevel: 1 },
  { id: 'c5', altId: 'char_algegal', name: 'Algegal', stat: 'Balanced (3 Hearts)', icon: '🎀', unlockLevel: 1 },
  { id: 'c1', name: 'Ada Lovelace', stat: '+3s / Q Timer', icon: '👩‍💻', unlockLevel: 2 },
  { id: 'c2', name: 'Isaac Newton', stat: '+1 Bonus Heart', icon: '🍎', unlockLevel: 3 },
  { id: 'c3', name: 'Nikola Tesla', stat: '+2 Hearts, +3s Timer', icon: '⚡', unlockLevel: 4 },
  { id: 'c4', name: 'Marie Curie', stat: '+2 Hearts, Shield', icon: '☢️', unlockLevel: 5 },
];

const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', unlockLevel: 1 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', unlockLevel: 1 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', unlockLevel: 3 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', unlockLevel: 5 },
  { id: 'g5', name: 'Golden Protractor', stat: '+3 Hearts, +5s / Q', icon: '📐', unlockLevel: 7 },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', unlockLevel: 1 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', unlockLevel: 2 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', unlockLevel: 4 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', unlockLevel: 6 },
];

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [purging, setPurging] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) { console.error('Fetch failed:', error); return; }

    // Retrieve emails from Supabase Auth as a fallback if not set in public.users
    const authUsersMap = {};
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData && authData.users) {
        authData.users.forEach((u) => {
          if (u.email) authUsersMap[u.id] = u.email;
        });
      }
    } catch (e) {
      console.warn('Could not list auth users:', e);
    }

    const all = (data || []).map((d) => {
      const email = d.email || authUsersMap[d.id] || null;
      const ingameName = d.ingame_name || d.username || null;

      // Auto-backfill missing email or ingame_name in public.users
      if ((!d.email && email) || (!d.ingame_name && ingameName)) {
        supabase
          .from('users')
          .update({
            ...(d.email ? {} : { email }),
            ...(d.ingame_name ? {} : { ingame_name: ingameName }),
          })
          .eq('id', d.id)
          .then(() => {});
      }

      // Backfill Supabase Auth display_name with username (so it shows in Supabase dashboard)
      if (d.username && authUsersMap[d.id] !== undefined) {
        supabase.auth.admin.updateUserById(d.id, {
          user_metadata: { display_name: d.username, username: d.username },
        }).then(() => {});
      }

      return {
        ...d,
        email,
        ingameName,
        isActive: d.is_active,
        unlockedLevel: d.unlocked_level || 1,
        levelStars: d.level_stars || {},
        totalBattles: d.total_battles || 0,
        wins: d.wins || 0,
        currentStreak: d.current_streak || 0,
        maxStreak: d.max_streak || 0,
        coins: d.coins ?? 100,
        inventory: Array.isArray(d.inventory)
          ? d.inventory
          : (typeof d.inventory === 'string' ? (() => { try { return JSON.parse(d.inventory); } catch { return []; } })() : ['char_algebro', 'g1', 'c0']),
        equippedCharacter: d.equipped_character || 'char_algebro',
        equippedGear: d.equipped_gear || null,
        skillStocks: d.skill_stocks || {},
        mmr: d.mmr ?? 500,
      };
    });

    setGuestCount(all.filter((d) => !d.username).length);

    const registered = all.filter((d) => !!d.username);
    registered.sort((a, b) => {
      const nameA = a.ingameName || a.username || '';
      const nameB = b.ingameName || b.username || '';
      return nameA.localeCompare(nameB);
    });
    setPlayers(registered);
  };

  useEffect(() => {
    fetchPlayers();

    // Subscribe to real-time changes (replaces Firestore onSnapshot)
    const channel = supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchPlayers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleActive = async (playerId, currentlyActive) => {
    setUpdating(playerId);
    try {
      await supabase
        .from('users')
        .update({ is_active: !currentlyActive })
        .eq('id', playerId);
    } catch (err) {
      console.error('Failed to update player:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    setUpdating(playerId);
    try {
      // 1. Delete user from Supabase Auth (auth.users)
      try {
        await supabase.auth.admin.deleteUser(playerId);
      } catch (authErr) {
        console.warn('Supabase Auth user delete notice:', authErr);
      }

      // 2. Delete player profile row from public.users table
      await supabase.from('users').delete().eq('id', playerId);
    } catch (err) {
      console.error('Failed to delete player:', err);
    } finally {
      setUpdating(null);
    }
  };

  const executePurgeGuests = async () => {
    setPurging(true);
    try {
      const { data: guests } = await supabase
        .from('users')
        .select('id')
        .is('username', null);

      if (guests && guests.length > 0) {
        for (const guest of guests) {
          try {
            await supabase.auth.admin.deleteUser(guest.id);
          } catch (_) {}
        }
      }

      await supabase.from('users').delete().is('username', null);
    } catch (err) {
      console.error('Failed to purge guests:', err);
    } finally {
      setPurging(false);
    }
  };

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    const displayName = p.ingameName || p.username || '';
    const email = p.email || '';
    return (
      displayName.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const totalActive = players.filter((p) => p.isActive !== false).length;
  const totalInactive = players.filter((p) => p.isActive === false).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-border flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-text">{players.length}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">Total Players</div>
        </div>
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-success/20 flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-success">{totalActive}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">Active</div>
        </div>
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-danger/20 flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-danger">{totalInactive}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">Inactive</div>
        </div>
      </div>

      {/* Guest cleanup banner */}
      {guestCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-medium text-sm text-amber-900">
                {guestCount} orphaned guest document{guestCount !== 1 ? 's' : ''} found
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                Anonymous sessions with no registered username
              </div>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            onClick={() => setConfirmDialog({
              title: 'Purge Guest Data',
              message: `Are you sure you want to permanently delete ${guestCount} orphaned guest document(s)? This action cannot be undone.`,
              confirmLabel: 'Purge Guests',
              action: () => executePurgeGuests()
            })}
            disabled={purging}
          >
            {purging ? (
              <span className="animate-pulse">Purging...</span>
            ) : (
              'Purge Guests'
            )}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-admin-surface rounded-lg border border-admin-border overflow-hidden flex flex-col">
        <div className="p-5 border-b border-admin-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-admin-text">Players</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-input"
              type="text"
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-admin-bg border border-admin-border rounded-md text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-primary/30 focus:border-admin-primary transition-all"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-admin-text whitespace-nowrap">
            <thead className="bg-admin-surface-alt text-admin-text-muted border-b border-admin-border uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Player</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {filtered.map((player) => {
                const isActive = player.isActive !== false;
                const email = player.email || '—';
                const displayName = player.ingameName || player.username;
                const avatarLetter = (displayName || 'G').charAt(0).toUpperCase();

                return (
                  <Fragment key={player.id}>
                    <tr className={`hover:bg-admin-surface-alt transition-colors ${expandedPlayer === player.id ? 'bg-admin-surface-alt border-l-2 border-l-admin-primary' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-admin-surface-alt border border-admin-border flex items-center justify-center text-admin-text-secondary font-medium text-sm">
                            {avatarLetter}
                          </div>
                          <div>
                            <div className="font-medium text-admin-text">
                              {displayName}
                            </div>
                            {player.username && (
                              <div className="text-xs text-admin-text-muted">
                                @{player.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-admin-text-secondary font-mono text-sm">{email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${isActive ? 'bg-emerald-50 text-admin-success border-admin-success/20' : 'bg-admin-surface-alt text-admin-text-muted border-admin-border'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-admin-success' : 'bg-admin-text-muted'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          className={`inline-flex items-center justify-center p-1.5 text-admin-text-secondary border border-admin-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-admin-primary/30 ${expandedPlayer === player.id ? 'bg-admin-surface-alt' : 'bg-admin-surface hover:bg-admin-surface-alt'}`}
                          title="View Progress"
                          onClick={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                        <button
                          className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[80px] ${isActive ? 'bg-admin-surface text-admin-danger border-admin-danger/20 hover:bg-red-50 focus:ring-admin-danger/30' : 'bg-emerald-50 text-admin-success border-admin-success/20 hover:bg-emerald-100 focus:ring-admin-success/30'}`}
                          onClick={() => toggleActive(player.id, isActive)}
                          disabled={updating === player.id}
                        >
                          {updating === player.id
                            ? <span className="animate-pulse">...</span>
                            : isActive
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                        <button
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 bg-admin-danger text-white border-admin-danger hover:bg-red-500 focus:ring-admin-danger/30 min-w-[60px]"
                          onClick={() => setConfirmDialog({
                            title: 'Delete Player Account',
                            message: (
                              <>
                                Are you sure you want to delete <span className="font-semibold text-admin-text">{displayName}</span>? All of their data will be permanently removed. This action cannot be undone.
                              </>
                            ),
                            confirmLabel: 'Delete Account',
                            action: () => handleDeletePlayer(player.id)
                          })}
                          disabled={updating === player.id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {expandedPlayer === player.id && (
                      <tr className="bg-admin-surface-alt/50 border-l-2 border-l-admin-primary border-b border-b-admin-border">
                        <td colSpan="4" className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                              <h3 className="text-xs font-semibold text-admin-text uppercase tracking-wider">Overall Stats</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Level Reached</div>
                                  <div className="text-lg font-semibold text-admin-text mt-0.5">{player.unlockedLevel || 1}</div>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Total XP</div>
                                  <div className="text-lg font-semibold text-admin-text mt-0.5">{player.xp || 0}</div>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Total Battles</div>
                                  <div className="text-lg font-semibold text-admin-text mt-0.5">{player.totalBattles || 0}</div>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Battles Won</div>
                                  <div className="text-lg font-semibold text-admin-text mt-0.5">{player.wins || 0}</div>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Current Streak</div>
                                  <div className="text-lg font-semibold text-admin-text mt-0.5">{player.currentStreak || 0}</div>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Max Streak</div>
                                  <div className="text-lg font-semibold text-admin-text mt-0.5">{player.maxStreak || 0}</div>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Coins</div>
                                  <div className="text-lg font-semibold text-amber-600 mt-0.5">🪙 {player.coins ?? 100}</div>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-md p-3">
                                  <div className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">MMR Rating</div>
                                  <div className="text-lg font-semibold text-admin-primary mt-0.5">{player.mmr ?? 500}</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-xs font-semibold text-admin-text uppercase tracking-wider">Level Progress</h3>
                              <div className="bg-admin-surface border border-admin-border rounded-md p-4 max-h-[300px] overflow-y-auto">
                                {!player.levelStars || Object.keys(player.levelStars).length === 0 ? (
                                  <div className="text-sm text-admin-text-muted text-center py-8">No level progress yet.</div>
                                ) : (
                                  <ul className="space-y-2">
                                    {Object.entries(player.levelStars).map(([levelId, stars]) => (
                                      <li key={levelId} className="flex justify-between items-center text-sm border-b border-admin-border/50 pb-2 last:border-0 last:pb-0">
                                        <span className="text-admin-text font-medium">Level {levelId}</span>
                                        <span className="text-admin-success bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium">{stars} Stars</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            {(() => {
                              const equippedChar = CHARACTERS.find(c => player.equippedCharacter === c.id || (c.altId && player.equippedCharacter === c.altId)) || CHARACTERS[0];
                              const equippedGear = GEARS.find(g => player.equippedGear === g.id);

                              return (
                                <div className="space-y-4">
                                  <h3 className="text-xs font-semibold text-admin-text uppercase tracking-wider">Player Loadout & Items</h3>
                                  <div className="bg-admin-surface border border-admin-border rounded-md p-4 space-y-3.5 max-h-[300px] overflow-y-auto">
                                    {/* Active Equipped Summary Bar */}
                                    <div className="bg-admin-surface-alt/70 border border-admin-border rounded p-2.5 flex items-center justify-between gap-2 text-xs">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-admin-text-muted">Equipped:</span>
                                        <span className="inline-flex items-center gap-1 font-medium text-admin-text bg-admin-surface px-2 py-0.5 rounded border border-admin-border text-xs" title="Equipped Character">
                                          <span>{equippedChar?.icon || '🧮'}</span>
                                          <span>{equippedChar?.name || 'Algebro'}</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-medium text-admin-text bg-admin-surface px-2 py-0.5 rounded border border-admin-border text-xs" title="Equipped Gear">
                                          <span>{equippedGear?.icon || '—'}</span>
                                          <span>{equippedGear?.name || 'No Gear'}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Characters */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Characters</span>
                                        <span className="text-[10px] text-admin-text-muted">
                                          {CHARACTERS.filter(c => (player.unlockedLevel >= c.unlockLevel) || (player.inventory || []).includes(c.id) || (c.altId && (player.inventory || []).includes(c.altId))).length}/{CHARACTERS.length} Unlocked
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {CHARACTERS.map(c => {
                                          const isEquipped = player.equippedCharacter === c.id || (c.altId && player.equippedCharacter === c.altId);
                                          const isUnlocked = player.unlockedLevel >= c.unlockLevel;
                                          const isOwned = isUnlocked || (player.inventory || []).includes(c.id) || (c.altId && (player.inventory || []).includes(c.altId));

                                          return (
                                            <span
                                              key={c.id}
                                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                                isEquipped
                                                  ? 'bg-emerald-50 text-admin-success border border-admin-success/40 font-semibold ring-1 ring-admin-success/30'
                                                  : isOwned
                                                  ? 'bg-admin-surface-alt border border-admin-border text-admin-text'
                                                  : 'bg-admin-surface-alt/40 border border-admin-border/40 text-admin-text-muted opacity-50'
                                              }`}
                                              title={`${c.name} (${c.stat}) • Unlock: Level ${c.unlockLevel}`}
                                            >
                                              <span>{c.icon}</span>
                                              <span className="truncate max-w-[85px]">{c.name}</span>
                                              {isEquipped && (
                                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded uppercase font-bold">Eq</span>
                                              )}
                                              {!isOwned && (
                                                <span className="text-[10px] opacity-60">🔒</span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Gears */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Gears</span>
                                        <span className="text-[10px] text-admin-text-muted">
                                          {GEARS.filter(g => (player.unlockedLevel >= g.unlockLevel) || (player.inventory || []).includes(g.id)).length}/{GEARS.length} Unlocked
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {GEARS.map(g => {
                                          const isEquipped = player.equippedGear === g.id;
                                          const isUnlocked = player.unlockedLevel >= g.unlockLevel;
                                          const isOwned = isUnlocked || (player.inventory || []).includes(g.id);

                                          return (
                                            <span
                                              key={g.id}
                                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                                isEquipped
                                                  ? 'bg-blue-50 text-admin-primary border border-admin-primary/40 font-semibold ring-1 ring-admin-primary/30'
                                                  : isOwned
                                                  ? 'bg-admin-surface-alt border border-admin-border text-admin-text'
                                                  : 'bg-admin-surface-alt/40 border border-admin-border/40 text-admin-text-muted opacity-50'
                                              }`}
                                              title={`${g.name} (${g.stat}) • Unlock: Level ${g.unlockLevel}`}
                                            >
                                              <span>{g.icon}</span>
                                              <span className="truncate max-w-[85px]">{g.name}</span>
                                              {isEquipped && (
                                                <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded uppercase font-bold">Eq</span>
                                              )}
                                              {!isOwned && (
                                                <span className="text-[10px] opacity-60">🔒</span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Skills */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-medium text-admin-text-muted uppercase tracking-wider">Skills</span>
                                        <span className="text-[10px] text-admin-text-muted">
                                          {SKILLS.filter(s => (player.unlockedLevel >= s.unlockLevel) || (player.inventory || []).includes(s.id)).length}/{SKILLS.length} Unlocked
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {SKILLS.map(s => {
                                          const isUnlocked = player.unlockedLevel >= s.unlockLevel;
                                          const isOwned = isUnlocked || (player.inventory || []).includes(s.id);
                                          const stock = player.skillStocks?.[s.id] || 0;

                                          return (
                                            <span
                                              key={s.id}
                                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                                isOwned
                                                  ? 'bg-admin-surface-alt border border-admin-border text-admin-text'
                                                  : 'bg-admin-surface-alt/40 border border-admin-border/40 text-admin-text-muted opacity-50'
                                              }`}
                                              title={`${s.name} (${s.desc}) • Unlock: Level ${s.unlockLevel}`}
                                            >
                                              <span>{s.icon}</span>
                                              <span className="truncate max-w-[85px]">{s.name}</span>
                                              {stock > 0 && (
                                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">x{stock}</span>
                                              )}
                                              {!isOwned && (
                                                <span className="text-[10px] opacity-60">🔒</span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-admin-text-muted text-sm">No players found</div>
          )}
        </div>
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
