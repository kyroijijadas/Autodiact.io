import { BookOpen } from 'lucide-react';

export function EmptyState({ title, detail }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><BookOpen size={19} /></div>
      <p className="mt-3 text-xs font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
    </div>
  )
}
