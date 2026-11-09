import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Modal } from '../common/Modal';

export function QuizEditor({ onClose, onSave, subjects = [] }) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(subjects[0] ?? '')
  const [questions, setQuestions] = useState([{
    text: '',
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
    ],
  }])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  function updateQuestion(index, patch) {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question))
  }
  function updateOption(questionIndex, optionIndex, patch) {
    setQuestions((current) => current.map((question, index) => index === questionIndex
      ? { ...question, options: question.options.map((option, choiceIndex) => choiceIndex === optionIndex ? { ...option, ...patch } : option) }
      : question))
  }
  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onSave({
        title,
        description: title.trim(),
        subject,
        time_limit_seconds: 900,
        questions,
      })
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal onClose={onClose} width="max-w-2xl">
      <form onSubmit={submit} className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">Create a quiz</h2>
          <p className="mt-1 text-xs text-slate-500">Add a title and questions. Mark the correct answer for each question.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            Quiz title
            <input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Introduction to biology" className="form-input" />
          </label>
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            Subject
            <select required value={subject} onChange={(event) => setSubject(event.target.value)} className="form-input">
              {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 space-y-4">
          {questions.map((question, questionIndex) => (
            <div key={questionIndex} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-bold text-slate-700">Question {questionIndex + 1}</p>{questions.length > 1 && <button type="button" onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))} className="text-[10px] font-semibold text-rose-500">Remove</button>}</div>
              <input required maxLength={5000} value={question.text} onChange={(event) => updateQuestion(questionIndex, { text: event.target.value })} placeholder="Write your question" className="form-input mt-0" />
              <div className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <button type="button" aria-label={`Mark choice ${optionIndex + 1} correct`} onClick={() => updateQuestion(questionIndex, { options: question.options.map((choice, index) => ({ ...choice, is_correct: index === optionIndex })) })} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${option.is_correct ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent'}`}><Check size={13} /></button>
                    <input required maxLength={1000} value={option.text} onChange={(event) => updateOption(questionIndex, optionIndex, { text: event.target.value })} placeholder={`Choice ${optionIndex + 1}`} className="form-input mt-0 py-2" />
                    {question.options.length > 2 && <button type="button" onClick={() => updateQuestion(questionIndex, { options: question.options.filter((_, index) => index !== optionIndex) })} className="p-1 text-slate-400 hover:text-rose-500" aria-label="Remove choice"><X size={14} /></button>}
                  </div>
                ))}
              </div>
              <button type="button" disabled={question.options.length >= 10} onClick={() => updateQuestion(questionIndex, { options: [...question.options, { text: '', is_correct: false }] })} className="mt-3 text-[10px] font-bold text-violet-600 disabled:text-slate-300">+ Add a choice</button>
            </div>
          ))}
        </div>
        <button type="button" disabled={questions.length >= 100} onClick={() => setQuestions((current) => [...current, { text: '', options: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }])} className="mt-3 rounded-lg px-2 py-2 text-[10px] font-bold text-violet-600 hover:bg-violet-50 disabled:text-slate-300">+ Add a question</button>
        {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
          <button disabled={busy || !subjects.length} className="rounded-xl bg-[#7557e8] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Creating…' : 'Create quiz'}</button>
        </div>
      </form>
    </Modal>
  )
}
