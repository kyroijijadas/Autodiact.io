import { LogIn, LogOut, X } from 'lucide-react';
import { navigation, roleTitles } from '../../utils/appData';
import { Logo } from '../common/Brand';

export function Sidebar({ role, activePage, onNavigate, onLogout, isDemo, mobileOpen, closeMobile }) {
  const items = navigation[role] ?? navigation.student;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobile}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white p-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Logo fullWidth />
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-2 text-slate-400 lg:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Main navigation">
          {items.map(({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              onClick={() => {
                onNavigate(label);
                closeMobile();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${activePage === label ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <p className="truncate px-3 text-sm font-bold text-slate-800">
            {isDemo ? 'Guest' : 'Signed in'}
          </p>
          <p className="px-3 pt-1 text-xs text-slate-500">{roleTitles[role]}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {isDemo ? <LogIn size={17} /> : <LogOut size={17} />}
            {isDemo ? 'Sign in' : 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  );
}
