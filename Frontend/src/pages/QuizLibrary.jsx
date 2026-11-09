import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { QuizCard } from '../components/quizzes/QuizCard';

export function QuizLibrary({
  quizzes,
  role,
  subjects,
  accessByQuiz,
  onOpenQuiz,
  onRequestAccess,
  onCreate,
  isDemo,
  requestingQuizId,
}) {
  const isProfessor = role === 'professor';
  const [selectedSubject, setSelectedSubject] = useState('All subjects');
  const availableSubjects = useMemo(
    () => [...new Set(quizzes.map((quiz) => quiz.subject).filter(Boolean))].sort(),
    [quizzes],
  );
  const visibleQuizzes = selectedSubject === 'All subjects'
    ? quizzes
    : quizzes.filter((quiz) => quiz.subject === selectedSubject);

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {isProfessor ? 'My quizzes' : 'Available quizzes'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isProfessor
              ? 'Create quizzes for your approved subject.'
              : 'Browse professor quizzes and request access before attempting one.'}
          </p>
        </div>
        {isProfessor && (
          <button
            type="button"
            onClick={onCreate}
            disabled={subjects.length === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} /> Create quiz
          </button>
        )}
      </div>

      {!isProfessor && availableSubjects.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <label htmlFor="quiz-subject-filter" className="text-xs font-semibold text-slate-500">
            Browse by subject
          </label>
          <select
            id="quiz-subject-filter"
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            className="form-input mt-0 w-auto min-w-40 py-2"
          >
            <option>All subjects</option>
            {availableSubjects.map((subject) => <option key={subject}>{subject}</option>)}
          </select>
        </div>
      )}

      {isProfessor && subjects.length === 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Your account has no approved teaching subject yet. Ask an admin to review your application.
        </p>
      )}

      {visibleQuizzes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onOpen={onOpenQuiz}
              onRequestAccess={onRequestAccess}
              role={role}
              accessStatus={accessByQuiz[quiz.id]}
              isDemo={isDemo}
              isRequesting={requestingQuizId === quiz.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={isProfessor ? 'No quizzes yet' : availableSubjects.length ? `No quizzes in ${selectedSubject}` : 'No quizzes available'}
          detail={isProfessor
            ? 'Create your first quiz to share it with students.'
            : 'New quizzes from professors will appear here.'}
        />
      )}
    </section>
  );
}
