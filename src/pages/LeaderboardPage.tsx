import { useNavigate } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'
import Leaderboard from '../components/admin/Leaderboard'

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const { guest } = useGuestContext()

  if (!guest) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/results')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
        </div>
        <Leaderboard />
      </div>
    </div>
  )
}
