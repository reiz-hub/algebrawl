import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

/* ──────────────────────────────────────────────
   Admin Reviews page — real-time reviews list
   with stat cards and per-row delete.
   ────────────────────────────────────────────── */

const StarDisplay = ({ rating }) => (
  <span className="inline-flex gap-0.5 text-base">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-admin-warning' : 'text-admin-border'}>
        ★
      </span>
    ))}
  </span>
);

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('Fetch reviews failed:', error); return; }

    // Map snake_case to camelCase for UI compatibility
    const mapped = (data || []).map((d) => ({
      ...d,
      playerId: d.player_id,
      createdAt: d.created_at,
    }));
    setReviews(mapped);
  };

  useEffect(() => {
    fetchReviews();

    // Subscribe to real-time changes (replaces Firestore onSnapshot)
    const channel = supabase
      .channel('reviews-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const executeDelete = async (reviewId) => {
    setDeleting(reviewId);
    try {
      await supabase.from('reviews').delete().eq('id', reviewId);
    } catch (err) {
      console.error('Failed to delete review:', err);
      setDeleting(null);
    }
  };

  /* Stats */
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1)
      : '—';

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Average Rating */}
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-warning/20 flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-warning flex items-baseline gap-2">
            {averageRating}
            {totalReviews > 0 && <span className="text-sm text-admin-warning/60">/ 5</span>}
          </div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">
            Average Rating
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-admin-surface rounded-lg p-5 border border-admin-primary/20 flex flex-col justify-center">
          <div className="text-2xl font-semibold text-admin-primary">{totalReviews}</div>
          <div className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-wider">
            Total Reviews
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-surface rounded-lg border border-admin-border overflow-hidden flex flex-col">
        <div className="p-5 border-b border-admin-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-admin-text">All Reviews</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-admin-text whitespace-nowrap">
            <thead className="bg-admin-surface-alt text-admin-text-muted border-b border-admin-border uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Player</th>
                <th className="px-6 py-3 font-medium">Rating</th>
                <th className="px-6 py-3 font-medium">Comment</th>
                <th className="px-6 py-3 font-medium">Date Submitted</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-admin-surface-alt transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-admin-surface-alt border border-admin-border flex items-center justify-center text-admin-text-secondary font-medium text-sm">
                        {(review.username || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div className="font-medium text-admin-text">
                        {review.username || 'Guest'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StarDisplay rating={review.rating || 0} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-admin-text-secondary max-w-xs truncate block">
                      {review.comment || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-admin-text-muted font-mono text-sm">
                    {formatDate(review.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border bg-admin-surface text-admin-danger border-admin-danger/20 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-admin-danger/30 focus:ring-offset-1 min-w-[70px]"
                      onClick={() => setConfirmDialog({
                        title: 'Delete Review',
                        message: 'Are you sure you want to permanently delete this review? This action cannot be undone.',
                        confirmLabel: 'Delete Review',
                        action: () => executeDelete(review.id)
                      })}
                      disabled={deleting === review.id}
                      id={`delete-review-${review.id}`}
                    >
                      {deleting === review.id ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reviews.length === 0 && (
            <div className="p-12 text-center text-admin-text-muted text-sm">
              No reviews yet
            </div>
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
