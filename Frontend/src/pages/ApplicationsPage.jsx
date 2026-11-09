import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
 

export function ApplicationsPage({
  role,
  applications,
  applicationLoading,
  onApply,
  onReview,
  isDemo,
  onSignIn,
}) {
  const [subject, setSubject] = useState('')
  const [error, setError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewingId, setReviewingId] = useState(null)

  async function handleReview(applicationId, action) {
    setReviewError('')
    setReviewingId(applicationId)
    try {
      await onReview(applicationId, action)
    } catch (requestError) {
      setReviewError(requestError.message || 'Unable to update this application.')
    } finally {
      setReviewingId(null)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (isDemo) {
      onSignIn()
      return
    }

    try {
      await onApply(subject.trim())
      setSubject('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit your application.')
    }
  }
  const isAdmin = role === 'admin'
  return (
    <section className="animate-rise-in">
      <div className="mb-6"><p className="text-[11px] font-semibold text-slate-400">{isAdmin ? 'Help educators find their place' : 'Share what you know'}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{isAdmin ? 'Professor applications' : 'Teach a subject'}</h1><p className="mt-2 text-xs text-slate-500">{isAdmin ? 'Review subject requests from your learning community.' : 'Request professor access for a subject. An admin will review your application.'}</p></div>
      {!isAdmin && role === 'student' && (
        <>
          <form onSubmit={submit} className="mb-5 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-5 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-[11px] font-bold text-slate-600">
              Subject you would like to teach
              <input required maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Mathematics, Graphic design" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
            </label>
            <button type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#7557e8] px-5 py-3 text-xs font-bold text-white">
              <Plus size={14} /> Submit request
            </button>
          </form>
          {error && <p role="alert" className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        </>
      )}
      {!isAdmin && role === 'student' && applications.some((application) => application.status === 'approved') && (
        <p className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          Your application was approved. Refresh the page to open professor tools.
        </p>
      )}
      {applicationLoading ? (
        <p role="status" className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
          Loading your applications…
        </p>
      ) : applications.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {reviewError && <p role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-700">{reviewError}</p>}
          <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_1fr] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
            <span>Applicant</span><span>Subject</span><span>Status</span><span>Actions</span>
          </div>

          {applications.map((application) => (
            <div key={application.id} className="grid gap-3 border-b border-slate-50 px-5 py-4 last:border-0 sm:grid-cols-[1.4fr_1fr_0.8fr_1fr] sm:items-center">
              <div><p className="text-xs font-bold text-slate-700">{application.username || 'Your request'}</p><p className="mt-1 text-[9px] text-slate-400">{new Date(application.created_at).toLocaleDateString()}</p></div>
              <p className="text-xs font-medium text-slate-600">{application.subject}</p>
              <span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${application.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : application.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{application.status}</span>
              {isAdmin && application.status === 'pending' ? (
                <div className="flex gap-2">
                  <button type="button" disabled={reviewingId !== null} onClick={() => handleReview(application.id, 'approve')} className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-50">
                    {reviewingId === application.id ? 'Saving…' : 'Approve'}
                  </button>
                  <button type="button" disabled={reviewingId !== null} onClick={() => handleReview(application.id, 'reject')} className="rounded-lg bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-wait disabled:opacity-50">
                    {reviewingId === application.id ? 'Saving…' : 'Decline'}
                  </button>
                </div>
              ) : <span className="text-[10px] text-slate-400">{isAdmin ? 'Reviewed' : application.status === 'pending' ? 'Awaiting review' : 'Application reviewed'}</span>}
            </div>
          ))}
          
        </div>
      ) : <EmptyState title={isAdmin ? 'All caught up' : 'No applications yet'} detail={isAdmin ? 'New professor requests will appear here.' : 'Submit a subject request to begin.'} />}
    </section>
  )
}
