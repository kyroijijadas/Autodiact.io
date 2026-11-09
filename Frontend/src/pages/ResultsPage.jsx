import { EmptyState } from '../components/common/EmptyState';

export function ResultsPage({ results }) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">My scores</h2>
        <p className="mt-1 text-sm text-slate-500">Scores from quizzes you have completed.</p>
      </div>
      {results.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {results.map((result) => (
            <div
              key={result.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-800">{result.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(result.completed_at).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm font-bold text-violet-700">
                {result.score} / {result.total_questions} ({result.percentage}%)
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No scores yet" detail="Complete a quiz to see your score here." />
      )}
    </section>
  );
}
