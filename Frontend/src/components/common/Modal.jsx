import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ children, onClose, width = 'max-w-3xl' }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className={`relative my-auto max-h-[92vh] w-full ${width} overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/20`}>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
