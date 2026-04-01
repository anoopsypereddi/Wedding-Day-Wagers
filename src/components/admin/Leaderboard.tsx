import { useLeaderboard } from '../../hooks/useLeaderboard'

const TROPHY = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { entries, answeredCount, loading, error, refetch } = useLeaderboard()

  if (loading) return <div className="text-gray-500">Computing scores…</div>
  if (error) return <div className="text-red-500">{error.message}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leaderboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            {answeredCount > 0
              ? `Scored on ${answeredCount} answered question${answeredCount === 1 ? '' : 's'}`
              : 'No correct answers marked yet'}
          </p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-gray-500 font-medium">No scores yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {answeredCount === 0
              ? 'Go to "Mark Answers" to set the correct answers first.'
              : 'No guests have submitted answers yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.guestId}
              className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                entry.rank === 1
                  ? 'border-yellow-300 bg-yellow-50/40'
                  : entry.rank === 2
                  ? 'border-gray-300 bg-gray-50/40'
                  : entry.rank === 3
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-gray-200'
              }`}
            >
              {/* Rank / trophy */}
              <div className="w-10 text-center shrink-0">
                {entry.rank <= 3 ? (
                  <span className="text-2xl">{TROPHY[entry.rank - 1]}</span>
                ) : (
                  <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                )}
              </div>

              {/* Name + score bar */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{entry.guestName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 max-w-40 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        entry.rank === 1 ? 'bg-yellow-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {entry.correct}/{entry.total} correct
                  </span>
                </div>
              </div>

              {/* Percentage */}
              <div className="text-right shrink-0">
                <p
                  className={`text-2xl font-bold ${
                    entry.rank === 1
                      ? 'text-yellow-500'
                      : entry.rank === 2
                      ? 'text-gray-500'
                      : entry.rank === 3
                      ? 'text-amber-600'
                      : 'text-gray-600'
                  }`}
                >
                  {entry.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {entries.length} participant{entries.length !== 1 ? 's' : ''} ranked
        </p>
      )}
    </div>
  )
}
