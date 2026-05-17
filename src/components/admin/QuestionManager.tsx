import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Question } from '../../types'

interface QuestionForm {
  text: string
  options: string[]
  category: string
  displayOrder: number
  isActive: boolean
}

const EMPTY_FORM: QuestionForm = {
  text: '',
  options: ['', '', '', ''],
  category: '',
  displayOrder: 0,
  isActive: true,
}

export default function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('questions')
      .select('*')
      .order('display_order', { ascending: true })
    if (err) { setError(err.message); setLoading(false); return }

    const mapped: Question[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      text: row.text as string,
      options: row.options as string[],
      category: row.category as string,
      correctAnswerIndex: row.correct_answer_index as number | null,
      lockedAt: row.locked_at as string | null,
      displayOrder: row.display_order as number,
      isActive: row.is_active as boolean,
    }))
    setQuestions(mapped)
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, displayOrder: questions.length + 1 })
    setModalOpen(true)
  }

  function openEdit(q: Question) {
    setEditingId(q.id)
    setForm({
      text: q.text,
      options: [...q.options],
      category: q.category,
      displayOrder: q.displayOrder,
      isActive: q.isActive,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      text: form.text.trim(),
      options: form.options.map(o => o.trim()).filter(Boolean),
      category: form.category.trim(),
      display_order: form.displayOrder,
      is_active: form.isActive,
    }
    const { error: err } = editingId
      ? await supabase.from('questions').update(payload).eq('id', editingId)
      : await supabase.from('questions').insert(payload)
    setSaving(false)
    if (err) { alert(`Save failed: ${err.message}`); return }
    setModalOpen(false)
    fetchQuestions()
  }

  async function toggleActive(q: Question) {
    await supabase.from('questions').update({ is_active: !q.isActive }).eq('id', q.id)
    fetchQuestions()
  }

  async function handleDelete(id: string) {
    const { error: err } = await supabase.from('questions').delete().eq('id', id)
    if (err) { alert(`Delete failed: ${err.message}`); return }
    setDeleteConfirmId(null)
    fetchQuestions()
  }

  function setOption(index: number, value: string) {
    setForm(f => {
      const opts = [...f.options]
      opts[index] = value
      return { ...f, options: opts }
    })
  }

  function addOption() {
    if (form.options.length >= 6) return
    setForm(f => ({ ...f, options: [...f.options, ''] }))
  }

  function removeOption(index: number) {
    if (form.options.length <= 2) return
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== index) }))
  }

  const validOptions = form.options.filter(o => o.trim()).length

  if (loading) return <div className="text-gray-500">Loading questions…</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Questions</h2>
          <p className="text-gray-500 text-sm mt-1">
            {questions.filter(q => q.isActive).length} active · {questions.length} total
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 transition-colors"
        >
          + Add Question
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`bg-white rounded-xl border p-4 ${q.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
          >
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs text-gray-400 font-mono">#{q.displayOrder || i + 1}</span>
              {q.category && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {q.category}
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  q.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {q.isActive ? 'Active' : 'Inactive'}
              </span>
              {q.correctAnswerIndex !== null && q.correctAnswerIndex !== undefined && (
                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                  Answer set
                </span>
              )}
            </div>

            {/* Question text + options */}
            <p className="text-gray-800 font-medium text-sm">{q.text}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {q.options.map((opt, oi) => (
                <span
                  key={oi}
                  className={`text-xs px-2 py-0.5 rounded-md ${
                    q.correctAnswerIndex === oi
                      ? 'bg-emerald-100 text-emerald-700 font-semibold'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {String.fromCharCode(65 + oi)}. {opt}
                  {q.correctAnswerIndex === oi && ' ✓'}
                </span>
              ))}
            </div>

            {/* Action buttons — full width row below content */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => toggleActive(q)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
                >
                  {q.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEdit(q)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirmId(q.id)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">❓</p>
            <p>No questions yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-gray-800 text-lg">Delete this question?</h3>
            <p className="text-gray-500 text-sm">
              This will permanently delete the question. Any existing guest answers for it will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg">
              {editingId ? 'Edit Question' : 'Add Question'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Question Text *</label>
                <textarea
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
                  rows={3}
                  placeholder="What will the couple do on their honeymoon?"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Category</label>
                <input
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="e.g. Future Plans, Wedding Night"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500">
                    Answer Options * <span className="text-gray-400">(min 2)</span>
                  </label>
                  <button
                    onClick={addOption}
                    disabled={form.options.length >= 6}
                    className="text-xs text-rose-500 hover:text-rose-600 disabled:opacity-40"
                  >
                    + Add option
                  </button>
                </div>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        value={opt}
                        onChange={e => setOption(i, e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      />
                      {form.options.length > 2 && (
                        <button
                          onClick={() => removeOption(i)}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-rose-500"
                    />
                    <span className="text-sm text-gray-600">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.text.trim() || validOptions < 2}
                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
