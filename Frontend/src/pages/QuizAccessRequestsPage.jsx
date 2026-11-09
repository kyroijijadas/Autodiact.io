import { useState } from 'react';
import { EmptyState } from '../components/common/EmptyState';

export function QuizAccessRequestsPage({ requests, onReview }) {
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [error, setError] = useState('');

  async function review(requestId, action) {
    setBusyRequestId(requestId);
    setError('');
    try {
      await onReview(requestId, action);
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setBusyRequestId(null);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">Quiz access requests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Approve students before they can take your quizzes.
        </p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {requests.length ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{request.student_username}</h3>
                <p className="mt-1 text-xs text-slate-600">{request.quiz_title} · {request.subject}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Requested {new Date(request.requested_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyRequestId === request.id}
                  onClick={() => review(request.id, 'reject')}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busyRequestId === request.id}
                  onClick={() => review(request.id, 'approve')}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No pending requests" detail="Student requests to take your quizzes will appear here." />
      )}
    </section>
  );
}
