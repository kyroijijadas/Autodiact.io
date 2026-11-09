import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../common/Brand';
import { Modal } from '../common/Modal';

export function AuthModal({ onClose, onLogin, onRegister }) {
  const [register, setRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (register) {
        await onRegister(username, password)
        setRegister(false)
        setNotice('Account created. Sign in to continue.')
      } else {
        await onLogin(username, password)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} width="max-w-md">
      <div className="px-7 pb-7 pt-8 sm:px-9">
        <div className="mb-7 flex justify-center"><Logo /></div>
        <div className="mb-7 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-violet-600">{register ? 'Start your journey' : 'Welcome back'}</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{register ? 'Create your account' : 'Sign in to learn'}</h2>
          <p className="mt-2 text-sm text-slate-500">{register ? 'Your account starts as a student.' : 'Your next big idea starts with one small lesson.'}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-600">
            Username
            <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" placeholder="Your username" />
          </label>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-600">Password</label>
            <div className="relative mt-2">
              <input id="auth-password" required type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" placeholder={register ? 'At least 8 characters' : 'Enter your password'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-violet-700">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">{notice}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7557e8] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-60">
            {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          {register ? 'Already have an account?' : 'New to Autodidact?'}{' '}
          <button type="button" onClick={() => { setRegister(!register); setError(''); setNotice('') }} className="font-bold text-violet-600 hover:text-violet-800">
            {register ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </Modal>
  )
}
