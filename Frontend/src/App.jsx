import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Menu } from 'lucide-react';
import { startAttempt, saveAttemptAnswers } from './api/attempts';
import {
  createQuiz,
  getMyQuizzes,
  getMyQuizAccess,
  getProfessorQuizAccessRequests,
  getPublishedQuizzes,
  requestQuizAccess,
  reviewQuizAccessRequest,
} from './api/quizzes';
import {
  applyForProfessorSubject,
  getMyProfessorApplications,
  getProfessorApplications,
} from './api/professorApplications';
import { getResults, submitAttempt } from './api/results';
import { AuthModal } from './components/auth/AuthModal';
import { AttemptModal } from './components/quizzes/AttemptModal';
import { QuizEditor } from './components/quizzes/QuizEditor';
import { Sidebar } from './components/layout/Sidebar';
import { NavRoutes } from './pages/NavRoutes';
import { useAuth } from './hooks/useAuth';

function firstPageForRole(role) {
  if (role === 'admin') return 'Professor applications';
  if (role === 'professor') return 'My quizzes';
  return 'Explore quizzes';
}

function App() {
  const { account, isDemo, login, logout, register } = useAuth();
  const [selectedPage, setSelectedPage] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [applications, setApplications] = useState([]);
  const [quizAccess, setQuizAccess] = useState({});
  const [quizAccessRequests, setQuizAccessRequests] = useState([]);
  const [requestingQuizId, setRequestingQuizId] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [attemptQuiz, setAttemptQuiz] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const role = account?.role ?? 'student';
  const activePage = selectedPage ?? firstPageForRole(role);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }, []);

useEffect(() => {
  let active = true;

  const quizRequest = isDemo || role === 'student'
    ? getPublishedQuizzes()
    : role === 'professor'
      ? getMyQuizzes()
      : Promise.resolve([]);

  quizRequest
    .then((loadedQuizzes) => {
      if (active) setQuizzes(loadedQuizzes);
    })
    .catch((error) => {
      if (active) showToast(`Could not load quizzes: ${error.message}`);
    });

  if (!isDemo && role === 'student') {
    getResults()
      .then((loadedResults) => {
        if (active) setResults(loadedResults);
      })
      .catch((error) => {
        if (active) showToast(`Could not load scores: ${error.message}`);
      });
    getMyQuizAccess()
      .then((accessRows) => {
        if (active) {
          setQuizAccess(Object.fromEntries(accessRows.map(({ quiz_id, status }) => [quiz_id, status])));
        }
      })
      .catch((error) => {
        if (active) showToast(`Could not load quiz access: ${error.message}`);
      });
  }

  if (!isDemo && role === 'professor') {
    getProfessorQuizAccessRequests()
      .then((requests) => {
        if (active) setQuizAccessRequests(requests);
      })
      .catch((error) => {
        if (active) showToast(`Could not load quiz access requests: ${error.message}`);
      });
  }

  if (!isDemo && role === 'admin') {
    getProfessorApplications()
      .then((loadedApplications) => {
        if (active) setApplications(loadedApplications);
      })
      .catch((error) => {
        if (active) showToast(`Could not load applications: ${error.message}`);
      });
  }

  return () => {
    active = false;
  };
}, [account?.id, isDemo, role, showToast]);

  async function handleLogin(username, password) {
    await login(username, password);
    setAuthOpen(false);
  }

  async function handleLogout() {
    await logout();
    setSelectedPage(null);
    setQuizzes([]);
    setResults([]);
    setApplications([]);
    setQuizAccess({});
    setQuizAccessRequests([]);
  }

  async function handleReview(){

  }

  async function handleApply(subject) {
    await applyForProfessorSubject(subject);
    await refreshMyApplications();
    showToast('Professor application submitted.');
  }

  async function refreshMyApplications() {
    setApplicationLoading(true);
    try {
      const currentApplications = await getMyProfessorApplications();
      setApplications(currentApplications);
    } finally {
      setApplicationLoading(false);
    }
  }

  async function handleCreateQuiz(payload) {
    try {
      await createQuiz(payload);
    } catch (error) {
      if (error.status === 401) {
        setEditorOpen(false);
        setAuthOpen(true);
        showToast('Please sign in again before creating a quiz.');
      }
      throw error;
    }

    try {
      setQuizzes(await getMyQuizzes());
      showToast('Quiz created and available to students.');
    } catch (error) {
      showToast(`Quiz created, but the list could not refresh: ${error.message}`);
    }
  }

  async function handleRequestQuizAccess(quizId) {
    setRequestingQuizId(quizId);
    try {
      await requestQuizAccess(quizId);
      const accessRows = await getMyQuizAccess();
      setQuizAccess(Object.fromEntries(accessRows.map(({ quiz_id, status }) => [quiz_id, status])));
      showToast('Access request sent to the professor.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setRequestingQuizId(null);
    }
  }

  async function handleReviewQuizAccess(requestId, action) {
    await reviewQuizAccessRequest(requestId, action);
    setQuizAccessRequests((current) => current.filter((request) => request.id !== requestId));
    showToast(action === 'approve' ? 'Student approved for this quiz.' : 'Access request rejected.');
  }

  const handleStartAttempt = useCallback((quizId) => startAttempt(quizId), []);
  const handleSaveAnswers = useCallback(
    (attemptId, answers) => saveAttemptAnswers(attemptId, answers),
    [],
  );
  const handleSubmitAttempt = useCallback(async (attemptId) => {
    const result = await submitAttempt(attemptId);
    if (account) setResults(await getResults());
    return result;
  }, [account]);

  function navigate(page) {
    setSelectedPage(page);
    setMobileOpen(false);
    if (page === 'Apply to teach' && !isDemo && role === 'student') {
      refreshMyApplications().catch((error) => showToast(error.message));
    }
    if (page === 'Explore quizzes' && !isDemo && role === 'student') {
      getMyQuizAccess()
        .then((accessRows) => {
          setQuizAccess(Object.fromEntries(accessRows.map(({ quiz_id, status }) => [quiz_id, status])));
        })
        .catch((error) => showToast(`Could not refresh quiz access: ${error.message}`));
    }
    if (page === 'Access requests' && !isDemo && role === 'professor') {
      getProfessorQuizAccessRequests()
        .then(setQuizAccessRequests)
        .catch((error) => showToast(`Could not refresh quiz access requests: ${error.message}`));
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1400px] bg-[#f7f8fc]">
        <Sidebar
          role={role}
          activePage={activePage}
          onNavigate={navigate}
          onLogout={isDemo ? () => setAuthOpen(true) : handleLogout}
          isDemo={isDemo}
          mobileOpen={mobileOpen}
          closeMobile={() => setMobileOpen(false)}
        />
        <main className="min-w-0 flex-1">
          <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <h1 className="text-sm font-bold text-slate-800">{activePage}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 sm:inline">
                {account?.username ?? 'Guest'} · {role}
              </span>
              <button
                type="button"
                onClick={isDemo ? () => setAuthOpen(true) : handleLogout}
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700"
              >
                {isDemo ? 'Sign in' : 'Sign out'}
              </button>
            </div>
          </header>
          <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
            <NavRoutes
              activePage={activePage}
              role={role}
              quizzes={quizzes}
              results={results}
              applications={applications}
              quizAccess={quizAccess}
              quizAccessRequests={quizAccessRequests}
              applicationLoading={applicationLoading}
              account={account}
              onOpenQuiz={setAttemptQuiz}
              onCreate={() => setEditorOpen(true)}
              onRequestQuizAccess={handleRequestQuizAccess}
              requestingQuizId={requestingQuizId}
              onReviewQuizAccess={handleReviewQuizAccess}
              onApply={handleApply}
              onReview={handleReview}
              isDemo={isDemo}
              onSignIn={() => setAuthOpen(true)}
            />
          </div>
        </main>
      </div>

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onLogin={handleLogin}
          onRegister={register}
        />
      )}
      {editorOpen && (
        <QuizEditor
          onClose={() => setEditorOpen(false)}
          onSave={handleCreateQuiz}
          subjects={account?.subjects ?? []}
        />
      )}
      {attemptQuiz && (
        <AttemptModal
          quiz={attemptQuiz}
          isDemo={isDemo}
          onClose={() => setAttemptQuiz(null)}
          onStart={handleStartAttempt}
          onSaveAnswers={handleSaveAnswers}
          onSubmitAttempt={handleSubmitAttempt}
          onSignIn={() => {
            setAttemptQuiz(null);
            setAuthOpen(true);
          }}
        />
      )}
      {toast && (
        <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
