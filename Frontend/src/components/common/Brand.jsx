import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

export function Logo({ small = false, fullWidth = false }) {
  const [imageAvailable, setImageAvailable] = useState(true)
  return (
    <div className={`flex items-center gap-2.5 ${fullWidth ? 'w-full min-w-0' : ''}`}>
      {imageAvailable ? (
        fullWidth ? (
          <div className="relative aspect-[4/1] w-full pt-20 overflow-hidden rounded-lg">
            <img
              src="/logo.png"
              alt="Autodidact"
              className="absolute inset-0 h-full w-full scale-100 object-cover"
              onError={() => setImageAvailable(false)}
            />
          </div>
        ) : (
          <img
            src="/logo.png"
            alt=""
            className={`${small ? 'h-8 w-8' : 'h-9 w-9'} rounded-xl object-contain`}
            onError={() => setImageAvailable(false)}
          />
        )
      ) : (
        <div className={`${small ? 'h-8 w-8' : 'h-9 w-9'} grid place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200`}>
          <GraduationCap size={small ? 17 : 19} strokeWidth={2.2} />
        </div>
      )}
     
    </div>
  )
}

export function Avatar({ name = 'Joshuel', size = 'md' }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return (
    <div className={`${size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs'} grid shrink-0 place-items-center rounded-full bg-[#f7ded2] font-bold text-[#805c48] ring-2 ring-white`}>
      {initials || 'A'}
    </div>
  )
}

export function IconButton({ children, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`relative grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 ${className}`}
    >
      {children}
    </button>
  )
}
