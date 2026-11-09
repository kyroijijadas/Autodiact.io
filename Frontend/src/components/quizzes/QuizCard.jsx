import { ArrowUpRight } from 'lucide-react';

export function QuizArtwork({ quiz, large = false }) {
  const styles = {
    violet: 'from-[#f2eaff] via-[#dfc9ff] to-[#b2a1ff] text-[#7549d8]',
    orange: 'from-[#fff2d6] via-[#ffd79b] to-[#ffb86b] text-[#dc833b]',
    pink: 'from-[#ffe4ee] via-[#fbc4db] to-[#eea5ca] text-[#d65e9a]',
    blue: 'from-[#e2f0ff] via-[#bddcff] to-[#93b9f4] text-[#4c78c2]',
  }
  return (
    <div className={`relative flex ${large ? 'h-48' : 'h-[126px]'} items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${styles[quiz.color] ?? styles.violet}`}>
      <div className="absolute -right-7 -top-10 h-32 w-32 rounded-full border-[18px] border-white/25" />
      <div className="absolute -bottom-16 -left-6 h-36 w-36 rounded-full bg-white/20" />
      <div className="absolute left-5 top-5 h-2 w-2 rounded-full bg-white/70" />
      <div className="absolute right-12 top-9 h-1.5 w-1.5 rounded-full bg-white/80" />
      <span className={`${large ? 'text-6xl' : 'text-5xl'} relative drop-shadow-sm`}>{quiz.icon ?? '✳'}</span>
      {large && <span className="absolute bottom-4 left-5 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold text-slate-700">{quiz.subject ?? 'Learning path'}</span>}
    </div>
  )
}

export function QuizCard({ quiz, onOpen, onRequestAccess, role, accessStatus, isDemo, isRequesting }) {
  const isStudent = role === 'student';
  const canTakeQuiz = accessStatus === 'approved';

  return (
    <article className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4">
      <div>
        <QuizArtwork quiz={quiz} />
        <div className="pb-1 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-md bg-violet-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-violet-600">{quiz.subject ?? 'Quiz'}</span>
        </div>
        <h3 className="text-sm font-bold text-slate-800">{quiz.title}</h3>
        {quiz.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{quiz.description}</p>}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{quiz.question_count ?? 0} questions</span>
          {isStudent && <ArrowUpRight size={14} />}
        </div>
        </div>
      </div>
      {isStudent && (
        <button
          type="button"
          disabled={(!isDemo && !canTakeQuiz && accessStatus === 'pending') || isRequesting}
          onClick={() => {
            if (canTakeQuiz || isDemo) onOpen(quiz);
            else onRequestAccess(quiz.id);
          }}
          className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        >
          {isDemo
            ? 'Sign in to request access'
            : isRequesting
              ? 'Sending request…'
              : canTakeQuiz
                ? 'Take quiz'
                : accessStatus === 'pending'
                  ? 'Request pending'
                  : accessStatus === 'rejected'
                    ? 'Request access again'
                    : 'Request access'}
        </button>
      )}
    </article>
  )
}
