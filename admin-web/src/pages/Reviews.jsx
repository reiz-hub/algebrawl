import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

/* ──────────────────────────────────────────────
   Admin Reviews page — real-time reviews list
   with stat cards and per-row delete.
   ────────────────────────────────────────────── */

const StarDisplay = ({ rating }) => (
  <span className="inline-flex gap-0.5 text-base">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-game-yellow' : 'text-game-border'}>
        ★
      </span>
    ))}
  </span>
);

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReviews(data);
    });
    return () => unsubscribe();
  }, []);

  const executeDelete = async (reviewId) => {
    setDeleting(reviewId);
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
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
    if (!timestamp?.toDate) return '—';
    return timestamp.toDate().toLocaleDateString('en-US', {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Rating */}
        <div className="bg-game-cream-alt rounded-xl p-6 shadow-sm border border-game-yellow/30 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-game-yellow/10 rounded-full -mr-10 -mt-10"></div>
          <div className="text-3xl font-black text-game-yellow relative z-10 flex items-baseline gap-2">
            {averageRating}
            {totalReviews > 0 && <span className="text-sm text-game-yellow/70">/ 5</span>}
          </div>
          <div className="text-sm font-bold text-game-yellow/80 mt-1 uppercase tracking-wider relative z-10">
            Average Rating
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-game-cream-alt rounded-xl p-6 shadow-sm border border-game-blue/30 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-game-blue/10 rounded-full -mr-10 -mt-10"></div>
          <div className="text-3xl font-black text-game-blue relative z-10">{totalReviews}</div>
          <div className="text-sm font-bold text-game-blue/80 mt-1 uppercase tracking-wider relative z-10">
            Total Reviews
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-game-cream-alt rounded-xl shadow-sm border border-game-border overflow-hidden flex flex-col">
        <div className="p-5 border-b border-game-border flex items-center justify-between bg-game-cream-alt">
          <h2 className="text-lg font-black text-game-text">All Reviews</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-game-text whitespace-nowrap">
            <thead className="bg-game-cream text-game-muted font-bold border-b border-game-border uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Comment</th>
                <th className="px-6 py-4">Date Submitted</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-game-border/50">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-game-cream transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-game-cream border border-game-border flex items-center justify-center text-game-text font-black shadow-sm">
                        {(review.username || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div className="font-bold text-game-text">
                        {review.username || 'Guest'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StarDisplay rating={review.rating || 0} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-game-muted font-medium max-w-xs truncate block">
                      {review.comment || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-game-muted font-mono text-sm">
                    {formatDate(review.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-black rounded-md border bg-game-cream-alt text-game-red border-game-red/30 hover:bg-game-red/10 transition-colors focus:outline-none focus:ring-2 focus:ring-game-red focus:ring-offset-1 uppercase min-w-[70px]"
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
            <div className="p-12 text-center text-game-muted font-bold">
              No reviews yet
            </div>
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
