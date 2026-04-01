import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// Convert a UTC Date to the string format datetime-local inputs expect (local time)
function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export default function LockControl() {
  const [lockAt, setLockAt] = useState<Date | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  // Fetch current setting
  useEffect(() => {
    supabase
      .from('game_settings')
      .select('lock_at')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.lock_at) {
          const d = new Date(data.lock_at)
          setLockAt(d)
          setInputValue(toDatetimeLocalValue(d))
        }
        setLoading(false)
      })
  }, [])

  // Tick while a future lock is pending
  useEffect(() => {
    if (!lockAt || now >= lockAt.getTime()) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [lockAt, now])

  const isLocked = lockAt !== null && now >= lockAt.getTime()
  const isPending = lockAt !== null && !isLocked
  const msRemaining = lockAt ? lockAt.getTime() - now : 0

  const upsertLockAt = async (value: Date | null) => {
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase
      .from('game_settings')
      .upsert({ id: 1, lock_at: value?.toISOString() ?? null }, { onConflict: 'id' })
    if (error) {
      setSaveError(error.message)
    } else {
      setLockAt(value)
      if (value) setInputValue(toDatetimeLocalValue(value))
      setNow(Date.now())
    }
    setSaving(false)
  }

  const handleSet = () => {
    if (!inputValue) return
    upsertLockAt(new Date(inputValue))
  }

  const handleClear = () => {
    setInputValue('')
    upsertLockAt(null)
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading lock settings…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Submission Lock</h2>
        <p className="text-gray-500 text-sm mt-1">
          Set a deadline — guests can't change answers after this time.
        </p>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-xl border p-5 flex items-center gap-4 ${
          isLocked
            ? 'bg-red-50 border-red-200'
            : isPending
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}
      >
        <span className="text-3xl">
          {isLocked ? '🔒' : isPending ? '⏳' : '🔓'}
        </span>
        <div>
          <p className={`font-semibold ${isLocked ? 'text-red-700' : isPending ? 'text-amber-700' : 'text-green-700'}`}>
            {isLocked
              ? 'Submissions locked'
              : isPending
              ? `Locking in ${formatCountdown(msRemaining)}`
              : 'Submissions open'}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {lockAt
              ? `Deadline: ${lockAt.toLocaleString()}`
              : 'No deadline set — guests can edit freely'}
          </p>
        </div>
      </div>

      {/* Set deadline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-700">Set Lock Deadline</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="datetime-local"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            onClick={handleSet}
            disabled={saving || !inputValue}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Set Deadline'}
          </button>
          {lockAt && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-semibold rounded-lg text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
        <p className="text-xs text-gray-400">
          Times are in your local timezone. Once the deadline passes, the "Edit answers" button
          disappears and the questions page redirects to results.
        </p>
      </div>
    </div>
  )
}
