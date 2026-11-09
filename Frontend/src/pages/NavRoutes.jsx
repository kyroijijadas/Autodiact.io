import { ApplicationsPage } from './ApplicationsPage';
import { QuizLibrary } from './QuizLibrary';
import { ResultsPage } from './ResultsPage';
import { QuizAccessRequestsPage } from './QuizAccessRequestsPage';

export function NavRoutes({
  activePage,
  role,
  quizzes,
  results,
  applications,
  quizAccess,
  quizAccessRequests,
  applicationLoading,
  account,
  onOpenQuiz,
  onCreate,
  onRequestQuizAccess,
  requestingQuizId,
  onReviewQuizAccess,
  onApply,
  onReview,
  isDemo,
  onSignIn,
}) {
  if (activePage === 'My scores') {
    return <ResultsPage results={results} />;
  }

  if (activePage === 'Access requests' && role === 'professor') {
    return <QuizAccessRequestsPage requests={quizAccessRequests} onReview={onReviewQuizAccess} />;
  }

  if (activePage === 'Apply to teach' || activePage === 'Professor applications') {
    return (
      <ApplicationsPage
        role={role}
        applications={applications}
        applicationLoading={applicationLoading}
        onApply={onApply}
        onReview={onReview}
        isDemo={isDemo}
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <QuizLibrary
      quizzes={quizzes}
      role={role}
      subjects={account?.subjects ?? []}
      accessByQuiz={quizAccess}
      onOpenQuiz={onOpenQuiz}
      onRequestAccess={onRequestQuizAccess}
      onCreate={onCreate}
      isDemo={isDemo}
      requestingQuizId={requestingQuizId}
    />
  );
}
