import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        if (a.isGuest !== b.isGuest) return a.isGuest ? 1 : -1;
        return (a.username || '').localeCompare(b.username || '');
      });
      setPlayers(data);
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

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.username || '').toLowerCase().includes(q) ||
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
                return (
                  <tr key={player.id} className="hover:bg-game-cream transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-game-cream border border-game-border flex items-center justify-center text-game-text font-black shadow-sm">
                          {(player.username || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-game-text">
                            {player.username || 'Guest'}
                          </div>
                          {player.isGuest && (
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-bold bg-game-border/30 text-game-muted">Guest</span>
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
                    <td className="px-6 py-4 text-right">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-game-muted font-bold">No players found</div>
          )}
        </div>
      </div>
    </div>
  );
}
