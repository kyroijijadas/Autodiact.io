import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, FileCheck2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export function AttemptModal({ quiz, onClose, onStart, onSaveAnswers, onSubmitAttempt, isDemo, onSignIn }) {
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (isDemo) return
    let active = true
    onStart(quiz.id).then((response) => {
      if (!active) return
      setAttempt(response)
      setSecondsRemaining(Math.max(0, Math.floor((new Date(response.expiresAt).getTime() - Date.now()) / 1000)))
    }).catch((startError) => setError(startError.message))
    return () => { active = false }
  }, [quiz.id, isDemo, onStart])

  const finish = useCallback(async () => {
    if (!attempt || submittedRef.current) return
    submittedRef.current = true
    setBusy(true)
    try {
      const result = await onSubmitAttempt(attempt.attemptId)
      setAttempt((current) => ({ ...current, result }))
    } catch (submitError) {
      submittedRef.current = false
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }, [attempt, onSubmitAttempt])

  useEffect(() => {
    if (!attempt || attempt.result || secondsRemaining <= 0) return undefined
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsRemaining(next)
      if (next === 0) void finish()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [attempt, secondsRemaining, finish])

  async function choose(questionId, optionId) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }))
    try {
      await onSaveAnswers(attempt.attemptId, [{ question_id: questionId, option_id: optionId }])
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  const displayQuiz = attempt?.quiz ?? quiz
  const mins = String(Math.floor(secondsRemaining / 60)).padStart(2, '0')
  const secs = String(secondsRemaining % 60).padStart(2, '0')
  if (isDemo) {
    return (
      <Modal onClose={onClose} width="max-w-lg">
        <div className="p-7 text-center sm:p-9">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600"><BookOpen size={24} /></div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">{quiz.title}</h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">{quiz.description ?? 'Request access after signing in to ask the professor for approval.'}</p>
          <div className="my-5 flex justify-center gap-4 text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-1"><Clock3 size={13} /> {Math.ceil((quiz.time_limit_seconds ?? 900) / 60)} min</span><span className="flex items-center gap-1"><FileCheck2 size={13} /> {quiz.question_count ?? 0} questions</span></div>
          <button type="button" onClick={onSignIn} className="rounded-xl bg-[#7557e8] px-5 py-3 text-xs font-bold text-white">Sign in to request access</button>
        </div>
      </Modal>
    )
  }
  if (error && !attempt) return <Modal onClose={onClose} width="max-w-md"><div className="p-8 text-center"><p role="alert" className="text-sm font-semibold text-rose-600">{error}</p><button type="button" onClick={onClose} className="mt-5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">Close</button></div></Modal>
  return (
    <Modal onClose={onClose} width="max-w-2xl">
      {!attempt ? <div className="p-10 text-center text-xs font-semibold text-slate-500">Preparing your quiz…</div> : attempt.result ? (
        <div className="p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={29} /></div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">Assessment complete</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">{attempt.result.score} <span className="text-slate-300">/ {attempt.result.totalQuestions}</span></h2>
          <p className="mt-1 text-xs text-slate-500">You scored {attempt.result.percentage}%{attempt.result.timedOut ? ' · submitted at the time limit' : ''}</p>
          <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-[#7557e8] px-5 py-3 text-xs font-bold text-white">Back to learning</button>
        </div>
      ) : (
        <div className="p-5 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600">{displayQuiz.subject}</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">{displayQuiz.title}</h2><p className="mt-1 text-[10px] text-slate-400">{displayQuiz.questions?.length ?? 0} questions</p></div>
            <div className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold tabular-nums ${secondsRemaining < 60 ? 'bg-rose-50 text-rose-600' : 'bg-violet-50 text-violet-700'}`}><Clock3 size={14} /> {mins}:{secs}</div>
          </div>
          <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
            {displayQuiz.questions?.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-bold leading-5 text-slate-800"><span className="mr-2 text-violet-600">{String(index + 1).padStart(2, '0')}</span>{question.text}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options?.map((option) => (
                  <button type="button" key={option.id} onClick={() => choose(question.id, option.id)} className={`rounded-xl border px-3 py-2.5 text-left text-[11px] transition ${answers[question.id] === option.id ? 'border-violet-300 bg-violet-50 font-bold text-violet-800' : 'border-slate-100 text-slate-600 hover:border-violet-200 hover:bg-slate-50'}`}>{option.text}</button>
                ))}</div>
              </div>
            ))}
          </div>
          {error && <p role="alert" className="mt-3 text-[10px] text-rose-600">{error}</p>}
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-[10px] text-slate-400">{Object.keys(answers).length} of {displayQuiz.questions?.length ?? 0} answered</span>
            <button type="button" onClick={finish} disabled={busy} className="rounded-xl bg-[#7557e8] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit assessment'}</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
