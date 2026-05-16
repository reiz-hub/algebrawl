import { collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState, Fragment } from 'react';
import { db } from '../firebase';

const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', unlockLevel: 1 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', unlockLevel: 1 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', unlockLevel: 3 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', unlockLevel: 5 },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐', unlockLevel: 7 },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', unlockLevel: 1 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', unlockLevel: 2 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', unlockLevel: 4 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', unlockLevel: 6 },
];

const OUTFITS = [
  { id: 'o1', name: 'Default Uniform', icon: '👕', unlockLevel: 1 },
  { id: 'o2', name: 'School Bag', icon: '🎒', unlockLevel: 2 },
  { id: 'o3', name: 'Lucky Cap', icon: '🧢', unlockLevel: 3 },
  { id: 'o4', name: 'Focus Scarf', icon: '🧣', unlockLevel: 4 },
  { id: 'o5', name: 'Battle Gi', icon: '🥋', unlockLevel: 5 },
  { id: 'o6', name: 'Champion Crown', icon: '👑', unlockLevel: 6 },
];

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [purging, setPurging] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Count orphaned guest docs (no username)
      setGuestCount(all.filter((d) => !d.username).length);

      // Only show registered players (those with a username)
      const registered = all.filter((d) => !!d.username);
      registered.sort((a, b) => {
        const nameA = a.ingameName || a.username || '';
        const nameB = b.ingameName || b.username || '';
        return nameA.localeCompare(nameB);
      });
      setPlayers(registered);
    });
    return () => unsubscribe();
  }, []);

  const toggleActive = async (playerId, currentlyActive) => {
    setUpdating(playerId);
    try {
      await updateDoc(doc(db, 'users', playerId), {
        isActive: !currentlyActive,
      });
    } catch (err) {
      console.error('Failed to update player:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    setUpdating(playerId);
    try {
      await deleteDoc(doc(db, 'users', playerId));
    } catch (err) {
      console.error('Failed to delete player:', err);
      setUpdating(null);
    }
  };

  const executePurgeGuests = async () => {
    setPurging(true);
    try {
      // Fetch all user docs, delete ones without a username
      const snapshot = await getDocs(collection(db, 'users'));
      const guestDocs = snapshot.docs.filter((d) => !d.data().username);
      await Promise.all(guestDocs.map((d) => deleteDoc(doc(db, 'users', d.id))));
    } catch (err) {
      console.error('Failed to purge guests:', err);
    } finally {
      setPurging(false);
    }
  };

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    const displayName = p.ingameName || p.username || '';
    return (
      displayName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const totalActive = players.filter((p) => p.isActive !== false).length;
  const totalInactive = players.filter((p) => p.isActive === false).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-game-cream-alt rounded-xl p-6 shadow-sm border border-game-border flex flex-col justify-center">
          <div className="text-3xl font-black text-game-text">{players.length}</div>
          <div className="text-sm font-bold text-game-muted mt-1 uppercase tracking-wider">Total Players</div>
        </div>
        <div className="bg-game-cream-alt rounded-xl p-6 shadow-sm border border-game-green/30 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-game-green/10 rounded-full -mr-10 -mt-10"></div>
          <div className="text-3xl font-black text-game-green relative z-10">{totalActive}</div>
          <div className="text-sm font-bold text-game-green/80 mt-1 uppercase tracking-wider relative z-10">Active</div>
        </div>
        <div className="bg-game-cream-alt rounded-xl p-6 shadow-sm border border-game-red/30 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-game-red/10 rounded-full -mr-10 -mt-10"></div>
          <div className="text-3xl font-black text-game-red relative z-10">{totalInactive}</div>
          <div className="text-sm font-bold text-game-red/80 mt-1 uppercase tracking-wider relative z-10">Inactive</div>
        </div>
      </div>

      {/* Guest cleanup banner */}
      {guestCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-black text-sm text-amber-800">
                {guestCount} orphaned guest document{guestCount !== 1 ? 's' : ''} found
              </div>
              <div className="text-xs font-bold text-amber-600 mt-0.5">
                Anonymous sessions with no registered username
              </div>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-lg border-2 border-amber-700 bg-amber-600 text-white hover:bg-amber-700 transition-colors uppercase tracking-wide disabled:opacity-50"
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
              <>🗑️ Purge Guests</>
            )}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-game-cream-alt rounded-xl shadow-sm border border-game-border overflow-hidden flex flex-col">
        <div className="p-5 border-b border-game-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-game-cream-alt">
          <h2 className="text-lg font-black text-game-text">Players</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-game-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-input"
              type="text"
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-game-cream border border-game-border rounded-lg text-sm font-bold text-game-text focus:outline-none focus:ring-2 focus:ring-game-text focus:border-game-text transition-shadow"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-game-text whitespace-nowrap">
            <thead className="bg-game-cream text-game-muted font-bold border-b border-game-border uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-game-border/50">
              {filtered.map((player) => {
                const isActive = player.isActive !== false;
                const email = player.username
                  ? `${player.username.toLowerCase()}@algebrawler.app`
                  : '—';
                const displayName = player.ingameName || player.username;
                const avatarLetter = (displayName || 'G').charAt(0).toUpperCase();

                return (
                  <Fragment key={player.id}>
                    <tr className={`hover:bg-game-cream transition-colors ${expandedPlayer === player.id ? 'bg-game-cream border-l-4 border-l-game-text' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-game-cream border border-game-border flex items-center justify-center text-game-text font-black shadow-sm">
                            {avatarLetter}
                          </div>
                          <div>
                            <div className="font-bold text-game-text">
                              {displayName}
                            </div>
                            {player.ingameName && player.ingameName !== player.username && (
                              <div className="text-xs text-game-muted font-bold">
                                @{player.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-game-muted font-mono text-sm">{email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${isActive ? 'bg-game-green/10 text-game-green border-game-green/20' : 'bg-game-border/20 text-game-muted border-game-border'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-game-green' : 'bg-game-muted'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          className={`inline-flex items-center justify-center p-1.5 text-game-text border border-game-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-game-text ${expandedPlayer === player.id ? 'bg-game-cream-alt shadow-inner' : 'bg-game-cream hover:bg-game-cream-alt'}`}
                          title="View Progress"
                          onClick={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                        <button
                          className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-black rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[80px] uppercase ${isActive ? 'bg-game-cream-alt text-game-red border-game-red/30 hover:bg-game-red/10 focus:ring-game-red' : 'bg-game-green/10 text-game-green border-game-green/30 hover:bg-game-green/20 focus:ring-game-green'}`}
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
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-black rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 bg-red-600 text-white border-red-700 hover:bg-red-700 focus:ring-red-500 min-w-[60px] uppercase"
                          onClick={() => setConfirmDialog({
                            title: 'Delete Player Account',
                            message: (
                              <>
                                Are you sure you want to delete <span className="font-semibold text-gray-900">{displayName}</span>? All of their data will be permanently removed. This action cannot be undone.
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
                      <tr className="bg-game-cream/30 border-l-4 border-l-game-text border-b border-b-game-border">
                        <td colSpan="4" className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                              <h3 className="text-sm font-black text-game-text uppercase tracking-wider">Overall Stats</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white border-2 border-game-border rounded-lg p-3 shadow-sm">
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider">Level Reached</div>
                                  <div className="text-xl font-black text-game-text">{player.unlockedLevel || 1}</div>
                                </div>
                                <div className="bg-white border-2 border-game-border rounded-lg p-3 shadow-sm">
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider">Total XP</div>
                                  <div className="text-xl font-black text-game-text">{player.xp || 0}</div>
                                </div>
                                <div className="bg-white border-2 border-game-border rounded-lg p-3 shadow-sm">
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider">Total Battles</div>
                                  <div className="text-xl font-black text-game-text">{player.totalBattles || 0}</div>
                                </div>
                                <div className="bg-white border-2 border-game-border rounded-lg p-3 shadow-sm">
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider">Battles Won</div>
                                  <div className="text-xl font-black text-game-text">{player.wins || 0}</div>
                                </div>
                                <div className="bg-white border-2 border-game-border rounded-lg p-3 shadow-sm">
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider">Current Streak</div>
                                  <div className="text-xl font-black text-game-text">{player.currentStreak || 0}</div>
                                </div>
                                <div className="bg-white border-2 border-game-border rounded-lg p-3 shadow-sm">
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider">Max Streak</div>
                                  <div className="text-xl font-black text-game-text">{player.maxStreak || 0}</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-sm font-black text-game-text uppercase tracking-wider">Level Progress</h3>
                              <div className="bg-white border-2 border-game-border rounded-lg p-4 max-h-[228px] overflow-y-auto shadow-sm">
                                {!player.levelStars || Object.keys(player.levelStars).length === 0 ? (
                                  <div className="text-sm text-game-muted font-bold text-center py-8">No level progress yet.</div>
                                ) : (
                                  <ul className="space-y-2">
                                    {Object.entries(player.levelStars).map(([levelId, stars]) => (
                                      <li key={levelId} className="flex justify-between items-center text-sm font-bold border-b border-game-border/10 pb-2 last:border-0 last:pb-0">
                                        <span className="text-game-text">Level {levelId}</span>
                                        <span className="text-game-green bg-game-green/10 px-2 py-0.5 rounded text-xs">{stars} Stars</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-sm font-black text-game-text uppercase tracking-wider">Unlocked Loadout</h3>
                              <div className="bg-white border-2 border-game-border rounded-lg p-4 max-h-[228px] overflow-y-auto shadow-sm space-y-4">
                                <div>
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider mb-2">Outfits</div>
                                  <div className="flex flex-wrap gap-2">
                                    {OUTFITS.filter(o => o.unlockLevel <= (player.unlockedLevel || 1)).map(o => (
                                      <span key={o.id} className="inline-flex items-center gap-1 px-2 py-1 bg-game-cream border border-game-border rounded text-xs font-bold text-game-text" title={o.name}>
                                        <span>{o.icon}</span> <span className="truncate max-w-[80px]">{o.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider mb-2">Gears</div>
                                  <div className="flex flex-wrap gap-2">
                                    {GEARS.filter(g => g.unlockLevel <= (player.unlockedLevel || 1)).map(g => (
                                      <span key={g.id} className="inline-flex items-center gap-1 px-2 py-1 bg-game-cream border border-game-border rounded text-xs font-bold text-game-text" title={`${g.name} (${g.stat})`}>
                                        <span>{g.icon}</span> <span className="truncate max-w-[80px]">{g.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-game-muted uppercase tracking-wider mb-2">Skills</div>
                                  <div className="flex flex-wrap gap-2">
                                    {SKILLS.filter(s => s.unlockLevel <= (player.unlockedLevel || 1)).map(s => (
                                      <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 bg-game-cream border border-game-border rounded text-xs font-bold text-game-text" title={`${s.name} (${s.desc})`}>
                                        <span>{s.icon}</span> <span className="truncate max-w-[80px]">{s.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
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
            <div className="p-12 text-center text-game-muted font-bold">No players found</div>
          )}
        </div>
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
